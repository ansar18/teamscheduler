# teamscheduler
little app with round robin team matching functionality

## Settings:
* **Weeks:** number of weeks to schedule
* **Teams:** number of teams to schedule
* **Courses:** number of courses to schedule on
* **Holes Per Course:** number of holes per course
* **Start Date:** date to start schedule on
* **Multiple Teams Per Hole on Extra:** if there are extra teams, (that are not extra because there is an odd number) then instead of adding them to 'Extra' at the bottom, we instead add another column to the schedule
* **Smart Sort:** sorts in a different manner, may take a bit longer on larger team counts and schedule lengths
* **Dup Check:** highlights duplicate scheduling (i.e. if a team is scheduled to play the same course/hole/team multiple weeks in a row)

## Load/Save Data
* **Load Data:** Paste JSON data that can be generated from the Save Data link
* **Save Data:** JSON data of your schedule, copy and save to load data back into scheduler

## Tabs:
* **Schedules:** the schedule cards for each week
* **Course By Team:** which course a team is playing on each week
* **Hole By Team:** which hole a team is playing on each week
* **Team vs. Team:** Which team a team is playing each week