# Description:
#  Interact with AWS ELB 
#
# Configuration:
#   HUBOT_AWS_ACCESS_KEY_ID
#   HUBOT_AWS_SECRET_ACCESS_KEY
#   HUBOT_AWS_EC2_REGIONS
#
# Commands:
#   hubot elb info <ELB name> - returns a table of instances and their status 
#

{ec2,elb,end} = require '../lib/streams'

module.exports = (robot) ->

  robot.respond /elb info (.*)/i, (msg) ->
    elb.health { res: msg, elb: msg.match[1] }  # Get Instance health info
      .pipe ec2.populate()                      # populate instance details
      .pipe end (obj) ->                        # Finish up
        msg.send "ELB: #{obj.elb}"
        msg.send "#{item.Tags.Name} (#{item.InstanceId}) - #{item.State.Name} - #{item.elb} #{item.PublicIpAddress}/#{item.PrivateIpAddress}" for item in obj.instances
