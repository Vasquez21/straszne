Hooks.on("init", () => {
    game.settings.register("wfrp4e-rnhd", "initialized", {
    name: "Initialization",
    scope: "world",
    config: false,
    default: false,
    type: Boolean
    });

    game.settings.registerMenu("wfrp4e-rnhd", "init-dialog", {
        name: "WFRP4e RNHD Initialization",
        label : "Initialize",
        hint : "This will import the content from the WFRP4e RNHD Module",
        type : WFRP4eRNHDInitWrapper,
        restricted: true
    })

    game.settings.register("wfrp4e-rnhd", "clock", {
        name: "Clock",
        scope: "world",
        config: false,
        default: {},
        type: Object
    });

    game.settings.register("wfrp4e-rnhd", "showClock", {
        name: "Show Clock",
        hint: "Shows the Clock Application on load.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("wfrp4e-rnhd", "syncClock", {
        name: "Sync Clock with Calendar/Weather",
        hint: "Synchronizes the clock with the time used by Calendar/Weather",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
})

Hooks.on("ready", () => {
    if (!game.settings.get("wfrp4e-rnhd", "initialized") && game.user.isGM)
    {
        new WFRP4eRNHDInitialization().render(true)
    } 

    if ((!game.modules.get("calendar-weather") || !game.modules.get("calendar-weather").active) && game.settings.get("wfrp4e-rnhd", "syncClock"))
    {
        ui.notifications.error("Calendar/Weather not active. Resetting Clock settings to be manual.")
        game.settings.set("wfrp4e-rnhd", "syncClock", false)
    }


    if (game.settings.get("wfrp4e-rnhd", "showClock"))
    {
        setProperty(game.wfrp4e, "rnhd.clock", new WFRPClockApp(game.settings.get("wfrp4e-rnhd", "clock")).render(true));
        game.socket.on("module.wfrp4e-rnhd", game.wfrp4e.rnhd.clock.registerClock.bind(game.wfrp4e.rnhd.clock))
    }

})


class WFRP4eRNHDInitWrapper extends FormApplication {
    render() {
        new WFRP4eRNHDInitialization().render(true);
    }
}

class WFRP4eRNHDInitialization extends Dialog{
    constructor()
    {
        super({
            title: "WFRP4e RNHD Initialization",
            content: `<p class="notes">Initialize WFRP4e RNHD Module?<br><br>This will import all Journals, Scenes, Items, and Actors into your world, and sort them into folders.</p>
            <ul>
            <li>104 Actors</li>
            <li>33 Journal Entries - RNHD Adventure</li>
            <li>17 Journal Entries - Pub Games</li>
            <li>3 Items</li>
            <li>6 Scenes</li>
            <li>20 Folders organizing the above</li>
            </ul> <p class="notes">
            Warhammer Fantasy Roleplay 4th Edition Rough Nights & Hard Days Module.<br><br>

            No part of this publication may be reproduced, distributed, stored in a retrieval system, or transmitted in any form by any means, electronic, mechanical, photocopying, recording or otherwise without the prior permission of the publishers.<br><br>
            
            Warhammer Fantasy Roleplay 4th Edition © Copyright Games Workshop Limited 2020. Warhammer Fantasy Roleplay 4th Edition, the Warhammer Fantasy Roleplay 4th Edition logo, GW, Games Workshop, Warhammer, The Game of Fantasy Battles, the twin-tailed comet logo, and all associated logos, illustrations, images, names, creatures, races, vehicles, locations, weapons, characters, and the distinctive likeness thereof, are either ® or TM, and/or © Games Workshop Limited, variably registered around the world, and used under licence. Cubicle 7 Entertainment and the Cubicle 7 Entertainment logo are trademarks of Cubicle 7 Entertainment Limited. All rights reserved.<br><br>
            
            <img src="modules/wfrp4e-rnhd/c7.png" height=50 width=50/>   <img src="modules/wfrp4e-rnhd/warhammer.png" height=50 width=50/>
            <br>
            Published by: <b>Cubicle 7 Entertainment Ltd</b><br>
            Foundry Edition by <b>Russell Thurman (Moo Man)</b><br>
            Special thanks to: <b>Games Workshop, Fatshark</b><br><br>
            
            <a href="mailto: info@cubicle7games.com">info@cubicle7games.com</a>
            `,

            buttons: {
	            initialize: {
	                label : "Initialize",
	                callback : async () => {
	                    game.settings.set("wfrp4e-rnhd", "initialized", true)
	                    await new WFRP4eRNHDInitialization().initialize()
	                    ui.notifications.notify("Initialization Complete")
						}
	                },
	                no: {
	                    label : "No",
	                    callback : () => {
    	                    game.settings.set("wfrp4e-rnhd", "initialized", true)
                            ui.notifications.notify("Skipped Initialization.")
                        }
                		}	
                	}
        })
        
        this.folders = {
            "Scene" : {},
            "Item" : {},
            "Actor" : {},
            "JournalEntry" : {}
        }
        this.SceneFolders = {};
        this.ActorFolders = {};
        this.ItemFolders = {};
        this.JournalEntryFolders = {};
        this.journals = {};
        this.scenes = {};
        this.moduleKey = "wfrp4e-rnhd"
    }

    async initialize() {
        return new Promise((resolve) => {
            fetch(`modules/${this.moduleKey}/initialization.json`).then(async r => r.json()).then(async json => {
                let createdFolders = await Folder.create(json)
                for (let folder of createdFolders)
                    this.folders[folder.data.type][folder.data.name] = folder;

                for (let folderType in this.folders) {
                    for (let folder in this.folders[folderType]) {

                        let parent = this.folders[folderType][folder].getFlag(this.moduleKey, "initialization-parent")
                        if (parent) {
                            let parentId = this.folders[folderType][parent].data._id
                            await this.folders[folderType][folder].update({ parent: parentId })
                        }
                    }
                }

                await this.initializeEntities()
                await this.initializeScenes()
                resolve()
            })
        })
    }

    async initializeEntities() {

        let packList= [ `${this.moduleKey}.rnhd-actors`,
                    `${this.moduleKey}.rnhd-campaign`,
                    `${this.moduleKey}.pubgames`,
                    `${this.moduleKey}.rnhd-items`]

        for( let pack of packList)
        {
            let content = await game.packs.get(pack).getContent();
            for (let entity of content)
            {
                let folder = entity.getFlag(this.moduleKey, "initialization-folder")
                if (folder)
                    entity.data.folder = this.folders[entity.entity][folder].data._id;
            }
            switch(content[0].entity)
            {
                case "Actor": 
                    ui.notifications.notify("Initializing Actors")
                    await Actor.create(content.map(c => c.data))
                    break;
                case "Item":
                    ui.notifications.notify("Initializing Items")
                    await Item.create(content.map(c => c.data))
                    break;
                case "JournalEntry" :
                    ui.notifications.notify("Initializing Journals")
                    let createdEntries = await JournalEntry.create(content.map(c => c.data))
                    if (!createdEntries.length)
                        break
                    for (let entry of createdEntries)
                        this.journals[entry.data.name] = entry
                    break;
            }
        }
    }

    async initializeScenes() {
        ui.notifications.notify("Initializing Scenes")
        let m = game.packs.get(`${this.moduleKey}.rnhd-scenes`)
        let maps = await m.getContent()
        for (let map of maps)
        {
            let folder = map.getFlag(this.moduleKey, "initialization-folder")
            if (folder)
                map.data.folder = this.folders["Scene"][folder].data._id;

            let journalName = map.getFlag(this.moduleKey, "scene-note")
            if (journalName)
                map.data.journal = game.journal.getName(journalName).data._id;

            map.data.notes.forEach(n => {
                try {
                    n.entryId = this.journals[getProperty(n, `flags.${this.moduleKey}.initialization-entryName`)].data._id
                }
                catch (e) {
                    console.log("wfrp4e | INITIALIZATION ERROR: " + e)
                }
            })
        }
        await Scene.create(maps.map(m => m.data)).then(sceneArray => {
            sceneArray.forEach(async s => {
                let thumb = await s.createThumbnail();
                s.update({"thumb" : thumb.thumb})
            })
        })
    }
}


class WFRP4eRNHDInitializationSetup {

    static async setup() 
    {
        WFRP4eRNHDInitializationSetup.displayFolders()
        WFRP4eRNHDInitializationSetup.setFolderFlags()
        WFRP4eRNHDInitializationSetup.setEmbeddedEntities()
    }

    static async displayFolders() {
        let array = [];
        game.folders.entities.forEach(async f => {
            if (f.data.parent)
                await f.setFlag("wfrp4e-rnhd", "initialization-parent", game.folders.get(f.data.parent).data.name)
        })
        game.folders.entities.forEach(f => {
            array.push(f.data)
        })
        console.log(JSON.stringify(array))
    }

    static async setFolderFlags() {
        for (let scene of game.scenes.entities)
            await scene.setFlag("wfrp4e-rnhd", "initialization-folder", game.folders.get(scene.data.folder).data.name)
        for (let actor of game.actors.entities)
            await actor.setFlag("wfrp4e-rnhd", "initialization-folder", game.folders.get(actor.data.folder).data.name)
        for (let item of game.items.entities)
            await item.setFlag("wfrp4e-rnhd", "initialization-folder", game.folders.get(item.data.folder).data.name)
        for (let journal of game.journal.entities)
            await journal.setFlag("wfrp4e-rnhd", "initialization-folder", game.folders.get(journal.data.folder).data.name)

        WFRP4eRNHDInitializationSetup.setSceneNotes();
    }

    static async setSceneNotes() {
        for (let scene of game.scenes.entities)
            if (scene.data.journal)
                await scene.setFlag("wfrp4e-rnhd", "scene-note", game.journal.get(scene.data.journal).data.name)
    }

    static async setEmbeddedEntities() {
        for (let scene of game.scenes.entities)
        {
            let notes = duplicate(scene.data.notes)
            for (let note of notes)
            {
                setProperty(note, "flags.wfrp4e-rnhd.initialization-entryName", game.journal.get(note.entryId).data.name)
            }
            await scene.update({notes : notes})
        }
    }


}