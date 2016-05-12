import { Mongo } from 'meteor/mongo';
export const foo = new Mongo.Collection('interactions');
var database;
if(Meteor.isServer)
{
  var database = new MongoInternals.RemoteCollectionDriver("mongodb://127.0.0.1:3001/meteor");
}
export const Interactions = new Mongo.Collection("Logs", { _driver: database });
