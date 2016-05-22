import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Events } from '../imports/api/querys.js';
import { Users } from '../imports/api/querys.js';
import { MissionLines } from '../imports/api/querys.js';
import { Missions } from '../imports/api/querys.js';
import { UserToEmail } from '../imports/api/querys.js';
//import '../imports/api/querys.js';


Template.body.onCreated(function() {
  google.charts.load('current', {'packages':['corechart']});
  Template.body.state = new ReactiveDict();
});

function getUserEvents(userid)
{
  var cursor = Events.find({_user: userid}, { sort: {_timestamp: 1} });
  var data = cursor.map(function(doc)
  {
    return [doc._user, doc.type, doc.room, doc.object, doc._timestamp, doc.act, doc.actor, doc.epoch, doc.error, doc.message, doc.percent, doc.mission, doc.chose];
  });
  cursor.rewind();
  var arr = new Array();
  var time0 = data[0][4];
  for(var i = 0; i < data.length; i++)
  {
    var duration = 0;
    if(i < data.length - 1)
    {
      var duration = (data[i + 1][4] - data[i][4])/1000;
    }
    var mission = data[i][11];
    var time = (data[i][4] - time0)/1000;
    arr.push(new Array(data[i][0], data[i][1], data[i][2], data[i][3], time, duration, mission ,data[i][5], data[i][6], data[i][7], data[i][8], data[i][9], data[i][10], data[i][12]));
  }
  Template.body.state.set('tableData', arr);
  return arr;
}

function getDate(userid)
{
  var event = Events.findOne({_user : userid});
  if(event)
  {
    return new Date(event._timestamp);
  }
  return new Date();
}

function getEventsChartData(userid)
{
  var data = new Array();
  var userEvents = getUserEvents(userid);
  var progMap = getRoomProgressionMappingForMissions(userid);
  var objectClickCounter = 0;
  var progress = 0;
  var levels = progMap.length;
  var levelCounter = 0;
  //time, progress, size, annotation, tooltip
  for(var i = 0; i < userEvents.length; i++)
  {
    var event = userEvents[i];
    var time = event[4];
    if(event[1] == 'enteredRoom')
    {
      progress = progMap[levelCounter][event[2]];
    }
    var feedBack =
    {
       "act" : event[7] ,
       "actor" : event[8] ,
       "epoche" : event[9] ,
       "error" :  event[10] ,
       "message" : event[11]
    };
    var row = {
      "time" : time,
      "progress" : progress,
      "type" : event[1],
      "mission" : progMap[levelCounter].mission,
      "feedBack" : feedBack,
      "room" : event[2],
      "object" : event[3],
      "chosenText" : event[13],
      "percent" : event[12]
    };
    data.push(row);
    if(event[1] == 'missionEnded')
    {
      levelCounter++;
    }
  }
  return data;
}

function drawChart(){
  if(Meteor.isClient){
    google.charts.setOnLoadCallback(drawChart);
    function drawChart() {
      selectedid = Template.body.state.get('selectedid');
      var data = new google.visualization.DataTable();
      data.addColumn('number', 'time');
      data.addColumn('number', 'progress');
      //data.addColumn('number', 'mission');
      data.addColumn({'type': 'string', 'role': 'style'});
      data.addColumn({'type': 'string', 'role': 'annotation'});
      data.addColumn({'type': 'string', 'role': 'tooltip'});
      var userEvents = getEventsChartData(selectedid);
      var max = 0;
      for(var i = 0; i < userEvents.length; i++)
      {
        var row = userEvents[i];
        var pointSize = 1;
        var tooltip = 'time : ' + row.time + '\n' +
                      'event  : ' + row.type;
        var pointShape = 'circle';
        var pointColor = 'blue';
        var annotation = '';
        if(row.type == 'objectClicked')
        {
          tooltip += '\n' + 'object  : ' + row.object;
        }
        if (row.type == 'dialogNext')
        {
          tooltip += '\n' + 'chosen dialog text : ' + row.chosenText;
        }
        if(row.type == 'enteredRoom')
        {
          tooltip += '\n' +  'progress : ' + row.progress + '\n' +
                        'room  : ' + row.room;
        }
        if(row.type == 'timelineFeedback')
        {
          pointShape = 'square';
          pointColor = 'red';
          pointSize = 7;
          tooltip = 'time : ' + row.time + '\n' +
                    'act : ' + row.feedBack.act + '\n' +
                    'actor : ' + row.feedBack.actor + '\n' +
                    'epoche : ' + row.feedBack.epoche + '\n' +
                    'error : ' + row.feedBack.error + '\n' +
                    'message : ' + row.feedBack.message + '\n';
        }
        if(row.type == 'activityEnded')
        {
          pointShape = 'circle';
          pointColor = 'green';
          pointSize = 7;
          tooltip += '\n' +  'percent correct  : ' + row.percent;
        }
        if(row.type == 'missionStarted')
        {
          pointShape = 'triangle';
          pointColor = 'green';
          pointSize = 7;
          tooltip += '\n' +  'mission  : ' + row.mission;
        }
        if(row.type == 'missionEnded' || row.type == 'missionStepCompleted')
        {
          pointShape = 'star';
          pointColor = 'yellow';
          pointSize = 7;
          tooltip += '\n' + 'mission  : ' + row.mission;
        }
        if(row.type == 'activityStarted')
        {
          pointShape = 'circle';
          pointColor = 'purple';
          pointSize = 7;
          tooltip += '\n' + 'mission  : ' + row.mission;
        }
        var point = 'point { size: '+ pointSize + '; shape-type: '+ pointShape + '; fill-color: '+ pointColor + '; }';
        data.addRow(new Array(row.time, row.progress, point, annotation, tooltip));
        if(max < row[1])
        {
            max = row[1];
        }
      }
      var options = {
        legend: getEventsChartData(Template.body.state.get('selectedid')),
        pointSize: 1,
        explorer: {
          actions: ['dragToZoom', 'rightClickToReset'],
          axis: 'horizontal',
          keepInBounds: true,
          maxZoomOut: 1,
          maxZoomIn: .001
        },
        vAxis: {
          title: 'progress',
          minValue: 0,
          gridlines: {
            count: max
          },
          ticks : getVLineTicks(selectedid),
          textStyle: {color: '#000', fontName: 'Arial', fontSize: 10}
        },
        hAxis: {
          title: 'time'
        },

      };

      var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
      chart.draw(data, options);
    }
  }
}

function getUsers()
{
  var arr = new Array();
  var users = Users.find().fetch();
  for(var i = 0 ; i < users.length; i++)
  {
    var user = users[i];
    var userEmail = UserToEmail.findOne({_id : user._id});
    if(userEmail)
    {
      var item = { "text" : userEmail.email, "value" : user._id };
    }
    arr.push(item);
  }
  return arr;
}

Template.body.helpers({
  userActivities()
  {
    selectedid = Template.body.state.get('selectedid');
    if(!selectedid)
    {
      return;
    }
    return getUserEvents(selectedid);
  },
  users()
  {
    return getUsers();
  },
  date()
  {
    return getDate(Template.body.state.get('selectedid'));
  }
});



Template.body.events({
    "change #category-select": function (event, template) {
        var user_id = $(event.currentTarget).val();
        Template.body.state.set('selectedid', user_id);
        drawChart();
    },
    'click #exportToCSV': function (event, instance) {
      var data = Template.body.state.get('tableData');
      var csvRows = ['\"User\" \, \"Type\" \, \"Room\" \, \"Object\" \, \"Timestamp [s]\" \, \"duration [s]\" \, \"Mission\" \, \"Feedback - act\" \, \"Feedback - actor\" \, \"Feedback - epoch\" \, \"Feedback - errors\" \, \"Feedback - message\" \, \"Feedback - noErrors\"'];
      for(var i = 0; i<data.length; i++)
      {

          var row = data[i];
          for(var j = 0; j<row.length; j++)
          {
            row[j] = '\"' + row[j] + '\"';
          }
          csvRows.push(row.join('\,'));
      }
      var csvString = csvRows.join("\n");
      var a         = document.createElement('a');
      a.href        = 'data:attachment/csv,' +  encodeURIComponent(csvString);
      a.target      = '_blank';
      a.download    = 'data.csv';
      document.body.appendChild(a);
      a.click();
    }
});

function getUserMissionLine(userid)
{
  var user = Users.findOne(userid);
  var missionLine = user.config.missionLine;
  return missionLine;
}

function getVLineTicks(userid)
{
  var arr = new Array();
  var progMap = getRoomProgressionMappingForMissions(userid);
  for(var i = 0; i < progMap.length; i++)
  {
    for (var prop in progMap[i])
    {
      var mission;
      if (progMap[i].hasOwnProperty(prop))
      {
        if(prop == "mission")
        {
          mission = progMap[i][prop];
        }
        //Prop is room
        else
        {
          var value = progMap[i][prop];
          var text = prop; // + "|" + mission.replace('mission','');
          var tick = { v : value, f : text };
          arr.push(tick);
        }
      }
    }
  }
  return arr;
}

function getTimeCastleRooms()
{
  return ["timecastle-outside", "timecastle-hall", "timecastle-hall", "timecastle-office", "timecastle-living-room", "timecastle-timemachine", "timemachine", "timeline"];
}

//Hard coded progression coding
function getRoomProgressionMappingForMissions(userid)
{
  var userMissionLine = getUserMissionLine(userid);
  var missionLine = Object.keys(MissionLines.findOne({ name : userMissionLine }).line);
  var levelCounter = 0;
  var levels = new Array();
  for(var i = 0; i < missionLine.length; i++)
  {
    var mission = Missions.findOne({ name : missionLine[i] });
    var levelMap = {"mission" : mission.name };
    var rooms = getTimeCastleRooms();
    var missionRooms = mission.unlock.rooms;
    for(var j = 0; j < missionRooms.length; j++)
    {
      rooms.push(missionRooms[j]);
    }
    for (var j = 0; j < rooms.length; j++)
    {
      levelMap[rooms[j]] = levelCounter++;
    }
    levels.push(levelMap);
  }
  return levels;
}
