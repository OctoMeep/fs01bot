const config = require("./config.json");
const fs = require("fs");
const discord = require("discord.js");
const utilities = require("./utilities.js");

exports.parseMove = (message, channelSettings) => {
	
	var isShout = false;
	if (message.content.startsWith("[")&&message.content.includes("]: ")) isShout = false;
	else if (message.content.startsWith("{")&&message.content.includes("}: ")) isShout = true;
    else throw new Error("That message is neither move nor shout");
	if (channelSettings.turnorder === [] && channelSettings.enforceturns) return message.channel.send("The turn order has not been set yet!");

var charTag = message.content.slice(0, message.content.indexOf(isShout?"}: ":"]: ") + 1).replace("{", "[").replace("}", "]");
        
    var role = message.guild.roles.find("name", charTag);
    
	if (!utilities.isRPChannel(message.channel)) message.channel.send("This is not an In-Character channel");
    else if (message.member.roles.has(message.guild.roles.find("name", "[GM]").id) || message.author.bot)  acceptMove(message);
    else if (role === null) message.channel.send("The charTag \"" + charTag + "\" does not exist!");
    else if (!message.member.roles.has(role.id)) message.channel.send("You don't have access to the charTag \"" + charTag + "\"!");
    else if (message.author.id != channelSettings.currentplayer && channelSettings.enforceturns) message.channel.send(message.author.toString() + ", it's not your turn!");
    else acceptMove(message);
}

acceptMove = (message) => {
	
	//268840016
	
	/*
	const viewers = message.channel.permissionOverwrites.filter(k=>k.type==="role").findAll("allow", 1024);
	//const viewers = new discord.Collection();
	//roles.forEach(role=>viewers.concat(role.members));
	viewers.forEach(viewer=>{
		const name = message.guild.roles.get(viewer.id).name;
		if (!name) return;
		else fs.appendFile(config.filepath + message.guild.id + "/save/" + name + ".md", message.content + "\n\n", function (err) {
			if (err) throw err;
			else {
				console.log("Saved!");
				message.channel.send(":+1:");
			}
		});
	});
	*/
	
	var processed = 0;
	
	message.channel.members.forEach(member=>{
		const name = member.nickname;
		if (!name) return;
		else fs.appendFile(config.filepath + message.guild.id + "/save/" + name + ".md", message.content + "\n\n", function (err) {
			if (err) throw err;
			else {
				console.log("Saved!");
				processed++;
				if (processed===message.channel.members.size) message.channel.send(":+1:");
			}
		});
	});
}