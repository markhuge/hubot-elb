var thru = require('through2').obj,
    merge = require('lodash.merge'),
    ENV  = process.env,
    opts = {
      region: ENV.HUBOT_AWS_EC2_REGIONS,
      accessKeyId: ENV.HUBOT_AWS_ACCESS_KEY_ID,
      secretAccessKey: ENV.HUBOT_AWS_SECRET_ACCESS_KEY
    },
    aws  = require('aws-sdk-sugar')(opts),
    format = function (obj) { console.log('no handler', obj); };


exports.elb = {
  health: function (obj) {
  var stream = thru(health, flush);
  if (obj) stream.write(obj);
  return stream;
  }
};



exports.ec2 = {
  populate: function (obj) {
  var stream = thru(getInstanceDetails, flush);
  if (obj) stream.write(obj);
  return stream;
 }
};



exports.end = function (cb, obj) {
  if (cb) format = cb;
  var stream = thru(end, flush);
  if (obj) stream.write(obj);
  return stream;
};

function end (obj, enc, cb) {
  format(obj);
  this.push(obj);
}


function getInstanceDetails (obj, enc, cb) {
  var that = this;
  if (obj.instances) {
    aws.ec2.hosts({InstanceIds: obj.instances}, function (err, data) {
      // Merge objects that share the same InstanceId. Kind of expensive,
      // but this operation is going to run on more than a few dozen keys max.
      obj.instances.map(function (instance) { 
        instance.elb = instance.State; // Reassign conflicting key
        data.map(function (_instance) { 
          if (_instance.InstanceId === instance.InstanceId) merge(instance,_instance);
        });
      });
      
      that.push(obj);
    });
  }
  else this.push(obj);
}

function health (obj, enc, cb) {
  var that = this;
  if (obj.elb) {
    aws.elb.health(obj.elb, function (err, data) {
      if (err) return obj.res.send(err);
      obj.instances = data;
      that.push(obj);
    });
  }
  else this.push(obj);
}

function flush (cb) { cb(); }

