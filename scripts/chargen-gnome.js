Hooks.on("setup", () => {
    WFRP4E = game.wfrp4e.config
    WFRP4E.species["gnome"] = "Gnome"

    WFRP4E.speciesCharacteristics["gnome"] = {
        "ws" : "2d10+20",
        "bs" : "2d10+10",
        "s"  : "2d10+10",
        "t"  : "2d10+15",
        "i"  : "2d10+30",
        "ag" : "2d10+30",
        "dex": "2d10+30",
        "int": "2d10+30",
        "wp" : "2d10+40",
        "fel": "2d10+15"
    }

    WFRP4E.speciesSkills["gnome"] =  [
        "Channelling (Ulgu)",
        "Charm",
        "Consume Alcohol",
        "Dodge",
        "Entertain (Any)",
        "Gossip",
        "Haggle",
        "Language (Ghassally)",
        "Language (Magick)",
        "Language (Wastelander)",
        "Outdoor Survival",
        "Stealth (Any)"
    ]

    WFRP4E.speciesTalents["gnome"] = [
        "Beneath Notice, Suffused with Ulgu",
        "Luck, Mimic",
        "Night Vision",
        "Fisherman, Read/Write",
        "Second Sight, Sixth Sense",
        "Small",
        0
    ]

    WFRP4E.speciesFate["gnome"] = 2;

    WFRP4E.speciesRes["gnome"] = 0;

    WFRP4E.speciesExtra["gnome"] = 2;

    WFRP4E.speciesMovement["gnome"] = 3;
});