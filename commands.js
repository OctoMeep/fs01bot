const config = require("./config.json");
const utilities = require("./utilities.js");
const fs = require("fs");

exports.parseCommand = (message, channelSettings, session) => {
    const gm = message.guild.roles.find("name", "[GM]"); 
	const mod = message.guild.roles.find("name", "Moderators");
    console.log("Parsing command " + message.content);
        
    if (message.content.startsWith("!done")) finishTurn(message, channelSettings);
	else if (message.content.startsWith("!turnorder")) {
    
        const args = message.content.split(/\s+/g).slice(1);
        
        var turnorderMentions;
        var turnorderNames;

        if (channelSettings.turnorder != []) {
            turnorderMentions = channelSettings.turnorder.map(k => message.guild.members.get(k).toString());
            
            turnorderNames = channelSettings.turnorder.map(k => " " + message.guild.members.get(k).nickname);
        }
        switch (args[0]) {
        case "set":
			const users = message.mentions.users.size ?Array.from(message.mentions.users.values()).map(k => k[1]):Array.from(message.channel.members.filter(k => {
				if(k.user.bot) return false;
				if(k.roles.some(role => role.name === "[GM]" || role.name === "Moderators")) {
					var RPRoles = k.roles.filter(role => {
						var success = (role.name.startsWith("[") && !(role.name === "[GM]"));
						return success;
					});			
					const viewerRoles = message.channel.permissionOverwrites.filter(overwrite => overwrite.type === "role" && (overwrite.allow === 1024 || overwrite.allow === 3072)).map(k => message.guild.roles.get(k.id));
					var isPlaying = false;
					RPRoles.forEach(role => {
						if(viewerRoles.some(k => k.id === role.id)) {
							isPlaying = true;
						}
					})
					return isPlaying;
				} else {
					return true;
				}
			})).map(k => k[1]);
			if (!users.length) return message.channel.send("No RP roles have access to this channel.");
            if (message.member.roles.has(gm.id)||message.author.bot) { //TODO: Use a function for this to avoid having the same if in each GM command
                //if (!message.mentions.users.size) return message.channel.send("A !turnorder set command must include one or more @mentions. Please try again.");

				console.log("Users: " + users);
				channelSettings.turnorder = users.reverse().map(k => {
					return k.id;
				});
				console.log(channelSettings.turnorder);
                turnorderMentions = channelSettings.turnorder.map(k => {
					console.log("Player: " + k);
					if (!k) return k;
					return message.guild.members.get(k).toString();
				});

				if (!(channelSettings.currentplayer&&channelSettings.turnorder.includes(channelSettings.currentplayer))) channelSettings.currentplayer = channelSettings.turnorder[0];
				console.log(users);
                message.channel.send("Turn order is: " + turnorderMentions + ", current player is: " + message.guild.members.get(channelSettings.currentplayer).toString());
                channelSettings.enforceturns = true;
				message.delete();
            } else return message.channel.send("You don't have permission to do that!");
            break;
        case "list":

            message.channel.send("Turn order is: " + turnorderNames + ", current player is: " + message.guild.members.get(channelSettings.currentplayer).user.username);
            message.delete();
            return; //This command does not modify the turnorder, so the saving below can be skipped
        case "on":
            if (message.member.roles.has(gm.id)) {
                channelSettings.enforceturns = true;
                message.channel.send("Turn order will now be enforced!");
                message.delete();
                break;
            } else return message.channel.send("You don't have permission to do that!");
        case "off":
            if (message.member.roles.has(gm.id)) {
                channelSettings.enforceturns = false;
                message.channel.send("Turn order will no longer be enforced!");
                message.delete();
                break;
            } else return message.channel.send("You don't have permission to do that!");
        }
        
        
    } else if (message.content.startsWith("!report")) {
		
		const args = message.content.split(" ").slice(1);
		
		const user = args[0];
		if (!user.startsWith("<@")) {
			message.reply("Sorry, did you miss a mention?");
			return;
		}
		else {
			message.guild.channels.get("401806428228026371").send(message.guild.roles.find("name", "Moderators").toString() + ", " + user + " has been reported for " + args.slice(1).join(" "))
			message.delete();
		}
	}
	else if (message.content.startsWith("!move")) {
		if (message.author.id != channelSettings.currentplayer&&channelSettings.enforceturns&&!message.member.roles.has(gm.id)) return message.reply("it's not your turn");
		const args = message.content.split(" ").slice(1);
		const roomTarget = message.guild.channels.find("name", args[0]);
		console.log(roomTarget);
        if (!utilities.checkDistance(message.channel, roomTarget)) return message.reply("sorry, that room is too far away");
		finishTurn(message, channelSettings);
		doMove(message.member, roomTarget, message.channel);
    }
	else if (message.content.startsWith("!forcemove")) {
		if (message.member.roles.has(gm.id)||message.member.roles.has(mod.id)||message.author.bot) {
			const args = message.content.split(" ").slice(1);
			const roomTarget = message.guild.channels.find("name", args[0]);
			console.log(roomTarget);
			message.mentions.roles.forEach(role => role.members.forEach(member => doMove(member, roomTarget, message.channel)));
		} else message.reply("You don't have permission to do that.")
		message.delete;
	} else if (message.content.startsWith("!activate")) {
		session.active = true;
		message.channel.send("The bot is now active");
		message.delete();
	} else if (message.content.startsWith("!deactivate")) {
		session.active = false;
		message.channel.send("The bot is now inactive");
		message.delete();
	} else if (message.content.startsWith("!announce")) {
		if (message.member.roles.has(gm.id)||message.member.roles.has(mod.id)||message.author.bot) {
			console.log(message.channel.name);
			if(message.channel.name === "moderator") {
				message.guild.channels.filter(channel => utilities.isRPChannel(channel)).forEach(channel => channel.send("[Speaker]: " + message.content.slice(10)));
			} else {
				message.reply("You can't do that here!");
				return;
			}
		} else message.reply("You don't have permission to do that.")
	} else if (message.content.startsWith("!battle")) {
		message.guild.members.forEach(member => {
			var battleRoom;
			if (member.roles.some(role => role.name === "fighter")) {
				battleRoom = message.guild.channels.find("name", "arena");
			} else {
				const placeRole = member.roles.find(val => val.name.startsWith("place-"));
				if (!placeRole) return;
				battleRoom = message.guild.channels.find("name", "battle-" + placeRole.name.slice(6));
			}
			
			doMove(member, battleRoom, message.channel);
		})
	}
	const path = config.filepath + message.guild.id + "/meta/" + message.channel.name + ".json";
	console.log(path);
    fs.writeFile(path, JSON.stringify(channelSettings), (err) => {
        if (err) console.error(err);
    });
}

function finishTurn(message, channelSettings) {
	const gm = message.guild.roles.find("name", "[GM]");
	if (channelSettings.turnorder === []) return message.channel.send("The turn order has not been set yet!");
    if (!channelSettings.enforceturns) return message.channel.send("The turn order is disabled!");
    if (message.author.id === channelSettings.currentplayer || message.member.roles.has(gm.id)) {
        var nextNum = channelSettings.turnorder.indexOf(channelSettings.currentplayer) + 1;
        if (nextNum === channelSettings.turnorder.length) nextNum = 0;
    
        channelSettings.currentplayer = channelSettings.turnorder[nextNum];
        console.log('Current player: ' + message.guild.members.get(channelSettings.currentplayer));
        message.channel.send("Your turn, " + message.guild.members.get(channelSettings.currentplayer).toString() + "!");
        message.delete();
    }
}

function doMove(member, roomTarget, outputChannel) {
	currentChannels = roomTarget.guild.channels.filter(channel => utilities.isRPChannel(channel) && member.permissionsIn(channel).has("VIEW_CHANNEL"));
	console.dir(currentChannels);
	//message.channel.send("!turnorder set");
	roomTarget.guild.channels.forEach(channel=>{
		//console.log("Reading channel " + channel.name);
		if (utilities.isRPChannel(channel)) channel.permissionOverwrites.forEach(overwrite => {
			
			var role = member.roles.get(overwrite.id);
			if (!role) return;
			var isRole = overwrite.type==="role";
			var hasRole = member.roles.has(overwrite.id);
			var charRole = role.name.startsWith("[");
			
			//console.log(isRole, hasRole, charRole);
			
			if (isRole&&hasRole&&charRole) {
				console.log(channel); 
				console.dir(overwrite);
				overwrite.delete()
			}
		});
	});
	var processed = 0;
	
	const charRoles = member.roles.filter(role=>role.name.startsWith("["));
	charRoles.forEach(role=>{
		roomTarget.overwritePermissions(role, {"VIEW_CHANNEL": true}).then(channel=>{
			processed++;
			if (processed==charRoles.size) {
				console.dir(currentChannels);
				currentChannels.forEach(channel => channel.send("!turnorder set"));
				roomTarget.send("!turnorder set");
			}
		});
	});
}