import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Interactions } from '../imports/api/querys.js';
import '../imports/api/querys.js';

if(Meteor.isClient){
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);
  function drawChart() {
    var data = google.visualization.arrayToDataTable
        ([['X', 'Y', {'type': 'string', 'role': 'style'}, {'type': 'string', 'role': 'annotation'}, {'type': 'string', 'role': 'tooltip'}],
          [1, 3, null, 'aaa', 'aaa'],
          [2, 2.5, null, 'aaa','aaa'],
          [3, 3, null, 'aaa','aaa'],
          [4, 4, null, 'aaa','aaa'],
          [5, 4, null, 'aaa','aaa'],
          [6, 3, 'point { size: 18; shape-type: star; fill-color: #a52714; }','aaa', 'aaa'],
          [7, 2.5, null,'aaa', 'aaa'],
          [8, 3, null,'aaa', 'aaa']
    ]);

    var options = {
      legend: 'none',
      hAxis: { minValue: 0, maxValue: 9 },
      pointSize: 7,
      dataOpacity: 0.3
    };

    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
  }
}

function getUserActivities(userid)
{
  var cursor = Interactions.find({_user: userid}, { sort: {_timestamp: 1} });
  var _users = cursor.map(function(doc) {return doc._user});
  cursor.rewind();
  var types = cursor.map(function(doc) {return doc.type});
  cursor.rewind();
  var _timestamps = cursor.map(function(doc) {return doc._timestamp});
  cursor.rewind();
  var messages = cursor.map(function(doc) {return doc.message});
  cursor.rewind();
  var passes = cursor.map(function(doc) {return doc.pass});
  var arr = new Array();
  for(var i = 0; i < _users.length; i++)
  {
    var duration = 0;
    if((_users[i + 1] == _users[i]))
    {
      var duration = _timestamps[i + 1] - _timestamps[i];
    }
    arr.push(new Array(_users[i], types[i], messages[i], passes[i], duration, _timestamps[i]));
  }
  return arr;
}

function getInteractionChartData(userid)
{
  var data = new Array();
  var userActivities = getUserActivities(userid);
  userActivities.forEach(function(activity){
    
  });
}


Template.body.helpers({
  userActivities()
  {
    selectedid = Template.body.state.get('selectedid');
    if(!selectedid)
    {
      return;
    }
    return getUserActivities(selectedid);
  },
  users()
  {
      return _.uniq(Interactions.find({}, { sort: {_user: 1}, fields: {_user: true} }).fetch().map(function(x)
      {
        return x._user;
      }), true);
  },
});

Template.body.onCreated(function() {
  Template.body.state = new ReactiveDict();
});

Template.body.events({
    "change #category-select": function (event, template) {
        var user_id = $(event.currentTarget).val();
        Template.body.state.set('selectedid', user_id);
    }
});
