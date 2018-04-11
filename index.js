const config = require("./config.json");
const Discord = require('discord.js');
const moves = require("./moves.js");
const commands = require('./commands.js');
const utilities = require("./utilities.js");
const client = new Discord.Client();
const fs = require("fs");

// Plain Text Stuff
// <#401806428228026371> = #moderator

var session = {
	active: false
};

client.login(config.token);

client.on('ready', () => {
  console.log('I am ready!');
  client.channels.findAll("name", "general").forEach(channel=>{
	  channel.send("Start Successful");
  });
});

client.on('message', message => {
	//console.log(message.channel.permissionOverwrites);
	//console.log(message.channel.permissionOverwrites.map(k => message.guild.roles.get(k.id).name))
	if (
			!(
				message.content.startsWith("!")
				|| message.content.startsWith("[")
			)
		) return;
	if (!session.active&&!(message.content.startsWith("!activate")||message.content.startsWith("!report"))) return message.channel.send("The bot is currently inactive");
	//console.log(Array.from(message.channel.permissionOverwrites.values()));
	
	var file = config.filepath + message.guild.id + "/meta/" + message.channel.name + ".json";
	
	const messageForms = ()=>{
		fs.readFile(file, "utf8", (err, content)=>{
			if (err) throw err;
			var turnorderKeep = JSON.parse(content);
			if (message.content.startsWith("!")) commands.parseCommand(message, turnorderKeep, session);
			else if (message.content.startsWith("[")&&message.content.includes("]: ")) moves.parseMove(message, turnorderKeep);
			else if (
				message.content.startsWith("{")&&message.content.includes("}: ") ||
				(message.content.startsWith("[")&&message.content.includes("]: ") && message.channel.name === "arena") // TODO: Delet this
			) {
				moves.parseMove(message, turnorderKeep);
				message.guild.channels.filter(channel=>message.channel.id!==channel.id&&utilities.checkDistance(message.channel, channel)&&utilities.isRPChannel(channel)).forEach(channel=>{ //Stupidness ensues due to lots of channels being highly inefficient
					console.log(channel);
					channel.send(message.content + " (shout)");
				});
			}
		})
	}
	
	fs.access(file, err=>{
		if (err) fs.writeFile(file, '{"turnorder":[],"currentplayer":"","enforceturns":false}', "utf8", ()=>{
			message.channel.send("no meta file yet... creating one");
			messageForms();
		});
		else messageForms();
	});
});