const config = require("./config.json");

exports.checkDistance=(channelA, channelB)=>{
	if (!(channelA.topic||channelB.topic)) return new Error("Both channel must have a topic starting with four numbers");
	const coord1 = channelA.topic.substring(0, 4);
	const x1 = parseInt(coord1.substring(0,2), 10);
	const y1 = parseInt(coord1.substring(2,4), 10);
	
	const coord2 = channelB.topic.substring(0, 4);
	const x2 = parseInt(coord2.substring(0,2), 10);
	const y2 = parseInt(coord2.substring(2,4), 10);
	
	const distance = Math.hypot(x2-x1,y2-y1);
	//console.log(coord1, coord2, x1, x2, y1, y2, distance);
	return distance<=config.range;
}

exports.isRPChannel=channel=>{
	return channel.topic && channel.permissionOverwrites.some(overwrite=>{
		if (overwrite.type==="role"&&overwrite.id===channel.guild.roles.find("name", "@everyone").id&&overwrite.deny===1024) {
			//console.log("Found private channel " + channel.name);
			return true;
		} else return false;
	})
}