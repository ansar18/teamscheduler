var settings = {
  counts: {
  	week: 6,
  	team: 25,
  	hole: 9,
  	course: 2,
  },
  start_date: '2016-04-22',
  multiple_teams_per_hole_if_extra: false,
  smart_sort: true,
  dup_check: false,
};

const page = new Page(settings);
page.init();
