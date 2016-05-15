import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Interactions } from '../imports/api/querys.js';
import { Users } from '../imports/api/querys.js';
//import '../imports/api/querys.js';


Template.body.onCreated(function() {
  google.charts.load('current', {'packages':['corechart']});
  Template.body.state = new ReactiveDict();
});

function getUserActivities(userid)
{
  var cursor = Interactions.find({_user: userid}, { sort: {_timestamp: 1} });
  var data = cursor.map(function(doc)
  {
    return [doc._user, doc.type, doc.room, doc.object, doc._timestamp, doc.act, doc.actor, doc.epoch, doc.error, doc.message, 0];
  });
  cursor.rewind();
  var arr = new Array();
  for(var i = 0; i < data.length; i++)
  {
    var skip = false;
    if(Template.body.state.get('filterDialogs'))
    {
      //if  contains
      if(data[1].indexOf("dialog") > -1)
      {
        skip = true;
      }
    }
    if(!skip)
    {
      var duration = 0;
      if(i < data.length - 1)
      {
        var duration = data[i + 1][4] - data[i][4];
      }
      arr.push(new Array(data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], duration, data[i][5], data[i][6], data[i][7], data[i][8], data[i][9], data[i][10]));
    }
  }
  return arr;
}

function getRoomProgressionMappingForMissions(userid)
{
  var user = Users.findOne(userid);
  var missionLine = user.config.missionLine;
  var levels;
  if(missionLine == 'march2016')
  //Start, Galilei, Chatelet, Changing times, science hinders women, spreading science, printing books
  {
    levels = [
      {
        "timecastle-outside" : 0,
        "timecastle-hall" : 1,
        "timecastle-office" : 2,
        "timecastle-living-room" : 3,
        "timecastle-timemachine" : 4,
        "timemachine" : 5
      },
      //Galilei
      {
        "timecastle-outside" : 10,
        "timecastle-hall" : 10,
        "timecastle-office" : 11,
        "timecastle-living-room" : 10,
        "timecastle-timemachine" : 11,
        "timemachine" : 11,
        "galilei-outside" : 12,
        "galilei" : 13
      },
      //Chatelet
      {
        "timecastle-outside" : 20,
        "timecastle-hall" : 20,
        "timecastle-office" : 21,
        "timecastle-living-room" : 20,
        "timecastle-timemachine" : 21,
        "timemachine" : 21,
        "chatelet" : 22
      },
      //changing times: chatelet(32-33) & galilei(34-35)
      {
        "timecastle-outside" : 30,
        "timecastle-hall" : 30,
        "timecastle-office" : 31,
        "timecastle-living-room" : 30,
        "timecastle-timemachine" : 31,
        "timemachine" : 31,
        "chatelet" : 32,
        "galilei-outside" : 34,
        "galilei" : 35,
        "newton-outside" : 36,
        "newton" : 37
      },
      //science hinders women: chatelet(42-43)
      {
        "timecastle-outside" : 40,
        "timecastle-hall" : 40,
        "timecastle-office" : 41,
        "timecastle-living-room" : 40,
        "timecastle-timemachine" : 41,
        "timemachine" : 41,
        "chatelet" : 42,
        "kirsh" : 44
      },
      //spreading science: chatelet(52-53), galilei(54-55) & newton(56-57)
      {
        "timecastle-outside" : 50,
        "timecastle-hall" : 50,
        "timecastle-office" : 51,
        "timecastle-living-room" : 50,
        "timecastle-timemachine" : 51,
        "timemachine" : 51,
        "chatelet" : 52,
        "galilei-outside" : 54,
        "galilei" : 55,
        "newton-outside" : 56,
        "newton" : 57
      },
      //printing books
      {
        "timecastle-outside" : 60,
        "timecastle-hall" : 60,
        "timecastle-office" : 61,
        "timecastle-living-room" : 60,
        "timecastle-timemachine" : 61,
        "timemachine" : 61,
        "luther-outside" : 62,
        "gutenberg" : 63,
        "gutenberg-workshop" : 64
      }
    ]
  }
  else if(missionLine == 'april2016')
  //Start, Pepys, Plauge
  {
    levels = [
      {
        "timecastle-outside" : 0,
        "timecastle-hall" : 1,
        "timecastle-office" : 2,
        "timecastle-living-room" : 3,
        "timecastle-timemachine" : 4,
        "timemachine" : 5
      },
      //Pepys
      {
        "timecastle-outside" : 10,
        "timecastle-hall" : 10,
        "timecastle-office" : 11,
        "timecastle-living-room" : 10,
        "timecastle-timemachine" : 11,
        "timemachine" : 11,
        "pepys" : 12,
        "pepys-diary" : 13
      },
      //Plauge
      {
        "timecastle-outside" : 20,
        "timecastle-hall" : 20,
        "timecastle-office" : 21,
        "timecastle-living-room" : 20,
        "timecastle-timemachine" : 21,
        "timemachine" : 21,
        "pepys" : 22,
        "pepys-diary" : 23,
        "plague-crossing" : 24,
        "plague-diary" : 25,
        "plague-board" : 26,
        "plague-square" : 27,
        "plague-rat-lord" : 28,
        "plague-church" : 29
      }
    ]
  }
  return levels;
}



function getInteractionChartData(userid)
{
  var data = new Array();
  var userActivities = getUserActivities(userid);
  var progMap = getRoomProgressionMappingForMissions(userid);
  var objectClickCounter = 0;
  var progress = 0;
  var levels = progMap.length;
  var levelCounter = 0;
  time0 = userActivities[0][4];
  //time, progress, size, annotation, tooltip
  for(var i = 0; i < userActivities.length; i++)
  {
    var activity = userActivities[i];
    var time = (activity[4] - time0)/1000;
    if(activity[1] == 'enteredRoom')
    {
      objectClickCounter = 0;
      progress = progMap[levelCounter][activity[2]];
    }
    if(activity[1] == 'objectClicked')
    {
      objectClickCounter++;
    }
    data.push(new Array(time, progress, objectClickCounter, activity[2], activity[1]));
    if(activity[1] == 'missionEnded')
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
      data.addColumn({'type': 'string', 'role': 'style'});
      data.addColumn({'type': 'string', 'role': 'annotation'});
      data.addColumn({'type': 'string', 'role': 'tooltip'});
      var userActivities = getInteractionChartData(selectedid);
      var max = 0;
      for(var i = 0; i < userActivities.length; i++)
      {
        var row = userActivities[i];
        if(row[4] == 'objectClicked' || row[4] == 'dialogNext')
        {
          continue;
        }
        var pointSize = row[2] + 1;
        var pointShape = 'circle';
        var pointColor = 'blue';
        var tooltip = 'Objects clicked: ' + row[2] + '\n' + row[3];
        if(row[4] == 'timelineFeedback')
        {
          pointShape = 'square';
          pointColor = 'red';
          tooltip = 'act : ' + row[6] + '\n' +
                    'actor : ' + row[7] + '\n' +
                    'epoche : ' + row[8] + '\n' +
                    'error : ' + row[9] + '\n' +
                    'message : ' + row[10];
        }
        else if(row[4] == 'missionStarted')
        {
          pointShape = 'pentagon';
          pointColor = 'green';
          pointSize = 5;
          tooltip = row[4];
        }
        else if(row[4] == 'missionEnded' || row[4] == 'missionStepCompleted')
        {
          pointShape = 'star';
          pointColor = 'yellow';
          pointSize = 5;
          tooltip = row[4];
        }
        row[2] = 'point { size: '+ pointSize + '; shape-type: '+ pointShape + '; fill-color: '+ pointColor + '; }';
        console.log(row[2]);
        row[4] = tooltip;
        row[3] = '';
        data.addRow(row);
        if(max < row[1])
        {
            max = row[1];
        }

      }
      var options = {
        legend: getInteractionChartData(Template.body.state.get('selectedid')),
        pointSize: 1,
        explorer: {
          keepInBounds: true,
          maxZoomOut: 1,
          maxZoomIn: .01
        },
        vAxis: {
          title: 'progress',
          minValue: 0,
          gridlines: {
            count: max // try to pick the correct number to create intervals of 50000
          }
        },
        hAxis: {
          title: 'time'
        }
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
    user = users[i];
    if(user)
    {
      var item = { "text" : user.profile.firstName, "value" : user._id };
    }
    arr.push(item);
  }
  return arr;
}

Template.body.helpers({
  userActivities()
  {
    selectedid = Template.body.state.get('selectedid');
    filterDialogs = Template.body.state.get('filterDialogs');
    if(!selectedid)
    {
      return;
    }
    return getUserActivities(selectedid, filterDialogs);
  },
  users()
  {
    return getUsers();
  },
});



Template.body.events({
    "change #category-select": function (event, template) {
        var user_id = $(event.currentTarget).val();
        Template.body.state.set('selectedid', user_id);
        drawChart();
    },
    'change #filterdialogs-input'(event, instance) {
      Template.body.state.set('filterDialogs', event.target.checked);
    }
});
