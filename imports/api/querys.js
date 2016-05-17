import { Mongo } from 'meteor/mongo';
//export const Interactions = new Mongo.Collection('interactions');
//export const Users = new Mongo.Collection('users');
var database;
if(Meteor.isServer)
{
  var database = new MongoInternals.RemoteCollectionDriver("mongodb://127.0.0.1:3001/meteor");
}
export const Users = new Mongo.Collection('users', { _driver: database });
export const Interactions = new Mongo.Collection('Logs', { _driver: database });
export const Missions = new  Mongo.Collection('MissionLines', { _driver: database });
