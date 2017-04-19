class Page {
  constructor(settings) {
    this.cols = 0;
    var tab = 'schedules';
    //var tab = 'course_team';
    //var tab = 'hole_team';
    this.letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    var _this = this;
    this.settings = settings;
    this.load_settings();

    $('#settings input').change(function() {
      if ($(this).attr('type') === 'checkbox') {
        _this.settings[$(this).attr('id')] = $(this).is(':checked');
      } else if ($(this).attr('type') === 'date') {
        _this.settings[$(this).attr('id')] = $(this).val();
      } else {
        _this.settings.counts[$(this).attr('id')] = parseInt($(this).val(), 10);
      }

      _this.init(_this.settings);
    });

    $('#load_data').click(function() {
      if ($(this).hasClass('show')) {
        $(this).removeClass('show');
        $('#action_info').hide();
        $('#load').hide();
        $('#load textarea').val('');
      } else {
        $(this).addClass('show');
        $('#action_info').show();
        $('#load').show();

        $('#save_data').removeClass('show');
        $('#save').hide();
      }
    });

    $('#import').click(function() {
      var data = JSON.parse($('#load textarea').val());
      _this.init(data.settings, data.schedule);

      $('#load_data').removeClass('show');
      $('#action_info').hide();
      $('#load').hide();
      $('#load textarea').val('');
    });

    $('#save_data').click(function() {
      if ($(this).hasClass('show')) {
        $(this).removeClass('show');
        $('#action_info').hide();
        $('#save').hide();
      } else {
        $(this).addClass('show');
        $('#action_info').show();
        $('#save').show();

        $('#save textarea').select();

        $('#load_data').removeClass('show');
        $('#load').hide();
      }
    });

    $('#' + tab + ', #' + tab + '-tab').addClass('selected');
    $('#tabs span').click(function() {
      var id = $(this).attr('id').split('-')[0];

      $('#content>div').removeClass('selected');
      $('#content #' + id).addClass('selected');

      $('#tabs span').removeClass('selected');
      $('#tabs #' + id + '-tab').addClass('selected');
    });
  }

  load_settings() {
    $.each(this.settings, function(setting, val) {
      if (setting === 'counts') {
        $.each(val, function(setting_count, count) {
          $('#' + setting_count).val(count);
        });
      } else {
        if ($('#' + setting).attr('type') === 'checkbox') {
          $('#' + setting).prop('checked', val);
        } else {
          $('#' + setting).val(val);
        }
      }
    });
  }

  init(settings, data) {
    this.settings = settings || this.settings;
    this.load_settings();
    this.odd = this.settings.counts.team % 2;
    this.schedule = [];
    this.team_by = {
      course: {},
      hole: {},
      team: {}
    };
    this.ranks_arr = {}

    if (data) {
      this.schedule = data;
    } else {
      this.create_schedule();
    }

    $('#save textarea').text(JSON.stringify({
      settings: this.settings,
      schedule: this.schedule
    }));

    $('#schedules').empty();
    this.build_schedule();

    var _this = this;
    $.each(_this.team_by, function(by, obj) {
      $('#' + by + '_team').empty();
      _this.build_data_table(by, by === 'course', by === 'hole');
    });
  }

  shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  create_table_data(teams, course, hole) {
    if (!teams) return;
    for (var s = 0; s < teams.length; s++) {
      this.team_by.course[teams[s]] = this.team_by.course[teams[s]] || [];
      this.team_by.course[teams[s]].push(course);

      this.team_by.hole[teams[s]] = this.team_by.hole[teams[s]] || [];
      this.team_by.hole[teams[s]].push(hole);

      this.team_by.team[teams[s]] = this.team_by.team[teams[s]] || [];
      var team = course === '_' ? '_' : (s === 0 ? teams[1] : teams[0]);
      this.team_by.team[teams[s]].push(team);
    }
  }

  create_schedule() {
    var schedule = [];
    var teams = [];

    this.vs_list = RoundRobin(this.settings.counts.team);

    var rounds = this.settings.counts.team % 2 ? this.settings.counts.team : this.settings.counts.team - 1;
    var even_rounds = Math.ceil(rounds / 2);
    var odd_rounds = Math.floor(rounds / 2);

    this.team_sections = {};
    for (var v = 0; v < this.vs_list.length; v++) {
      var r = (this.vs_list[v].r - 1);
      var c = r % 2 ? Math.floor(r / 2) + even_rounds : r / 2;

      if (!this.team_sections[c]) {
        this.team_sections[c] = [];
      }

      this.team_sections[c].push([this.vs_list[v].a, this.vs_list[v].b]);
    }

    var i = 0;
    for (var r = 0; r < rounds; r++) {
      var cut = this.team_sections[r].splice(0, i);

      this.team_sections[r] = this.team_sections[r].concat(cut);

      i = i < even_rounds ? i + 1 : 0;
    }

    var team_section = 0;
    for (var w = 0; w < this.settings.counts.week; w++) {
      var date = new Date(this.settings.start_date);
      date.setDate(date.getUTCDate() + (7 * w));

      var week = {
        date: date.toLocaleDateString(),
        vs: this.team_sections[team_section].slice(0),
        extra: []
      };

      team_section = team_section < rounds - 1 ? team_section + 1 : 0;

      //check for _ if odd
      if (this.odd) {
        for (var v = 0; v < week.vs.length; v++) {
          if (week.vs[v].indexOf('_') > -1) {
            var extra = week.vs.splice(v, 1)[0];
            extra.splice(extra.indexOf('_'), 1);
            this.create_table_data(extra, '_', '_');
            week.extra = week.extra.concat(extra);
          }
        }
      }

      week = this.sort_into_courses(w, week);

      schedule.push(week);
    }
    this.schedule = schedule;
  }

  sort_into_courses(w, week, col) {
    col = col || 0;
    if (col > this.cols) this.cols = col;
    week.courses = week.courses || {};
    week.courses[col] = week.courses[col] || [];

    for (var vs = 0; vs < week.vs.length; vs++) {

      var teams = week.vs[vs];
      var course_rank = this.sort_by_rank(teams, 'course', (w === 0 && teams.length !== 2), w);
      var hole_rank = this.sort_by_rank(teams, 'hole', (w === 0 && teams.length !== 2), w);

      var extra_team = true;
      for (var h = 0; h < this.settings.counts.hole; h++) {
        for (var c = 0; c < this.settings.counts.course; c++) {
          week.courses[col][course_rank[c]] = week.courses[col][course_rank[c]] || Array(this.settings.counts.hole).fill([]);

          if (week.courses[col][course_rank[c]][hole_rank[h]].length === 0) {
            week.courses[col][course_rank[c]][hole_rank[h]] = teams;
            this.create_table_data(teams, course_rank[c], hole_rank[h]);
            extra_team = false;
            break;
          }
        }

        if (extra_team === false) break;
      }

      if (extra_team === false) {
        week.vs.splice(vs, 1)[0];
        vs--;
      }

      if (!this.settings.multiple_teams_per_hole_if_extra && extra_team) {
        this.create_table_data(teams, '_', '_');
        week.extra = week.extra.concat(teams);

        week.vs.splice(vs, 1)[0];
        vs--;
      }
    }

    if (this.settings.multiple_teams_per_hole_if_extra && week.vs.length > 0) {
      col++;
      this.sort_into_courses(w, week, col);
    }

    week.extra.sort(this.sort_numbers);
    delete week.vs;

    return week;

  }

  strip_empty(arr) {
    for (var i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === '_') arr.splice(i, 1);
    }
    return arr;
  }

  sort_by_rank(teams, by, return_default_rank, w) {

    if (this.ranks_arr[by]) {
      this.ranks_arr[by].push(this.ranks_arr[by].shift());
    } else {
      this.ranks_arr[by] = Array.apply(null, {
        length: this.settings.counts[by]
      }).map(Number.call, Number);
    }

    if (!this.settings.smart_sort || return_default_rank || !this.team_by[by][teams[0]] || !this.team_by[by][teams[1]]) return this.strip_empty(this.ranks_arr[by]);

    var lasts = [];
    for (var t = 0; t < teams.length; t++) {
      lasts.push(this.team_by[by][teams[t]][this.team_by[by][teams[t]].length - 1]);
    }

    var info = {};
    for (var t = 0; t < teams.length; t++) {
      var team = teams[t];

      info[team] = {
        last: lasts[t], //last location played
        repeat: 0, //number of consecutive times last location has been played from now
        frequency: {}, //freq of location played
        rank: [] //rank of locations from least played to most, with last played at the end
      }

      this.team_by[by][team].forEach(function(value) {
        info[team].frequency[value] = 0;
      });

      info[team].rank = this.team_by[by][team].filter(function(value) {
        return ++info[team].frequency[value] == 1;
      });

      info[team].rank.sort(function(a, b) {
        return info[team].frequency[b] - info[team].frequency[a];
      });

      //if we're missing any values, add them now
      for (var i = 0; i < this.ranks_arr[by].length; i++) {
        if (info[team].rank.indexOf(this.ranks_arr[by][i]) < 0) info[team].rank.push(this.ranks_arr[by][i]);
      }

      //move last used to end of rank
      info[team].rank.splice(info[team].rank.indexOf(info[team].last), 1);
      info[team].rank.push(info[team].last);

      //check repeats of last course
      for (var i = this.team_by[by][team].length - 1; i > 0; --i) {
        if (this.team_by[by][team][i] === info[team].last) {
          info[team].repeat++;
        } else {
          break;
        }
      }
    }

    //if we've repeated the same number for each team, return the rank with the location
    //that has been repeated the least overall
    if (info[teams[0]].repeat === info[teams[1]].repeat) {
      if (info[teams[0]].frequency[info[teams[0]].last] > info[teams[1]].frequency[info[teams[1]].last])
        return this.strip_empty(info[teams[0]].rank);

      if (info[teams[1]].frequency[info[teams[1]].last] > info[teams[0]].frequency[info[teams[0]].last])
        return this.strip_empty(info[teams[1]].rank);
    }

    return info[teams[0]].repeat > info[teams[1]].repeat ? this.strip_empty(info[teams[0]].rank) : this.strip_empty(info[teams[1]].rank);
  }

  sort_numbers(a, b) {
    return a - b;
  }

  build_schedule() {
    var week_width = this.cols < 2 ? 145 : 145 + ((this.cols - 1) * 32);
    var col_percent = 1 / ((this.cols + 1) * 2);
    var col_width = Math.floor((week_width - 20) * col_percent);
    var col_style = 'width: ' + col_width + 'px';

    var $week = $('<div class="week" style="width:' + week_width + 'px"></div>');
    var $week_title = $('<h2 class="week_title"></h2>');
    var $course = $('<table class="course" cellspacing="0"></table>');
    var $course_title = $('<h3 class="course_title"></h3>');
    var $hole = $('<tr class="hole"></tr>');


    for (var w = 0; w < this.schedule.length; w++) {
      var $this_week = $week.clone();
      var $this_week_title = $week_title.clone().text('Week ' + (w + 1) + ' - ' + this.schedule[w].date);
      $this_week.append($this_week_title);

      for (var c = 0; c < this.settings.counts.course; c++) {
        var $this_course = $course.clone();
        var $this_course_title = $course_title.clone().text('Course ' + this.letters[c]);

        for (var h = 0; h < this.settings.counts.hole; h++) {
          var $this_hole = $hole.clone();
          $this_hole.append('<td ' + (h < 1 ? 'style="width:20px"' : '') + '>' + (h + 1) + '</td>');

          $.each(this.schedule[w].courses, function(col, courses) {
            courses[c] = courses[c] || [];
            courses[c][h] = !courses[c][h] || courses[c][h].length === 0 ? ['', ''] : courses[c][h];
            $this_hole.append('<td ' + (h < 1 ? 'style="' + col_style + '"' : '') + '>' + courses[c][h][0] + '</td><td class="div" ' + (h < 1 ? 'style="' + col_style + '"' : '') + '>' + courses[c][h][1] + '</td>');

          });

          $this_course.append($this_hole);
        }

        $this_week.append($this_course_title);
        $this_week.append($this_course);
      }

      if (this.schedule[w].extra.length > 0) {
        var $this_extra_title = $course_title.clone().text('Extra Teams (' + this.schedule[w].extra.length + ')').addClass('extra');
        var $this_extra = $('<div class="extra">' + this.schedule[w].extra.join(', ') + "</div>");

        $this_week.append($this_extra_title);
        $this_week.append($this_extra);
      }

      $('#schedules').append($this_week);
    }
  }

  build_data_table(data, letters, add_one) {
    var _this = this;
    var $table = $('<table/>').attr('cellspacing', 0).addClass('data');
    var $thead = $('<tr class="thead"></tr>');
    var $tbody = $('<tbody/>');

    $thead.append('<td>WEEKS</td>');
    for (var w = 0; w < this.settings.counts.week; w++) {
      $thead.append('<td>' + (w + 1) + '</td>');
    }
    $tbody.append($thead);

    $.each(_this.team_by[data], function(team, dataz) {
      var $tr = $('<tr>');
      $tr.append('<td class="team_name">Team ' + team + '</td>');
      for (var d = 0; d < dataz.length; d++) {
        var $td = $('<td>' + (dataz[d] === '_' ? '_' : letters ? _this.letters[dataz[d]] : (add_one ? dataz[d] + 1 : dataz[d])) + '</td>');

        if (_this.settings.dup_check === true) {
          var repeats = 0;
          for (var e = d - 1; e >= 0; e--) {
            if (dataz[e] !== dataz[d]) break;
            repeats++;
          }

          if (d < dataz.length - 1 && repeats < 1 && dataz[d] === dataz[d + 1]) {
            repeats++;
          } else if (repeats > 0) {
            repeats++;
          }

          if (repeats > 0) {
            var hue_slice = Math.floor(360 / _this.settings.counts.course) * (dataz[d] === '_' ? 0 : dataz[d] + 1);
            var alpha = repeats * .2 >= 1 ? 1 : repeats * .2;
            $td.addClass('dup_error').css('background-color', 'hsla(' + hue_slice + ', 100%, 50%, ' + alpha + ')')
          }
        }

        $tr.append($td);
      }
      $tbody.append($tr);
    });
    $table.append($tbody);

    $('#' + data + '_team').append($table);
  }
}