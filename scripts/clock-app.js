class WFRPClockApp extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "wfrp-clock";
        options.template = "modules/wfrp4e-rnhd/templates/clock.html";
        options.height = 500;
        options.width = 350;
        options.top = window.innerHeight;
        options.left = window.innerWidth - 740;
        options.resizable = true;
        options.popout = true;
        options.title = "Clock"
        return options;
    }

    constructor(clockData = {}) {
        super();

        this.synced = false;
        // Ignore input if syncing with about-time
        if (!game.settings.get("wfrp4e-rnhd", "syncClock")) {
            this.clock = new WFRP_Clock(clockData);
            this.synced = true;
        }

        else {
            this.clock = new WFRP_Clock();
            Hooks.on("ready", setTimeout(this.syncClock.bind(this), 5000))
            Hooks.on("updateWorldTime", this.syncClock.bind(this))
        }
    }


    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        // Add "Post to chat" button
        if (game.user.isGM) {
            buttons.unshift(
                {
                    class: "help",
                    icon: "fas fa-question",
                    onclick: ev => this.showHelp()
                })
        }
        return buttons
    }


    showHelp() {
        new Dialog({
            title: "Clock Help",
            content: `<p>Click: Advance 1 minute<br>Crtl-Click: Advance 10 minutes<br>Shift-Click: Advance 1 hour<br><br>Right click reverses.</p>`,
            buttons: {}
        }).render(true)

    }




    getData() {
        let data = super.getData();
        data.time = this.clock.time;
        if (!this.synced)
            data.time = "Syncing..."
        data.hourImg = `modules/wfrp4e-rnhd/assets/clock/hour/hour${this.clock.hour}.webp`
        data.minuteImg = `modules/wfrp4e-rnhd/assets/clock/minute/minute${this.clock.minute}.webp`
        return data
    }

    syncClock() {
        this.synced = true
        this.clock.changeTime({ hour: Gametime.DTNow().hours, minute: Gametime.DTNow().minutes })
        this.render(true)
    }

    broadcastClock() {
        game.socket.emit("module.wfrp4e-rnhd", "clock")
    }

    registerClock() {
        if (!game.settings.get("wfrp4e-rnhd", "syncClock")) {
            this.clock.changeTime(game.settings.get("wfrp4e-rnhd", "clock"))
            this.render(true);
        }
        else
            this.syncClock();
    }

    activateListeners(html) {
        super.activateListeners(html);

        if (!game.user.isGM)
            return

        if (game.settings.get("wfrp4e-rnhd", "syncClock")) {
            html.mousedown(ev => {

                if (ev.button == 0) {
                    if (ev.ctrlKey)
                        Gametime.advanceTime({ minutes: 10 })
                    else if (ev.shiftKey)
                        Gametime.advanceTime({ hours: 1 })
                    else
                        Gametime.advanceTime({ minutes: 1 })
                }
                else {
                    if (ev.ctrlKey)
                        Gametime.advanceTime({ minutes: -10 })
                    else if (ev.shiftKey)
                        Gametime.advanceTime({ hours: -1 })
                    else
                        Gametime.advanceTime({ minutes: -1 })
                }
            })
        }
        else {
            html.mousedown(ev => {

                if (ev.button == 0) {
                    if (ev.ctrlKey)
                        this.clock.advanceMinute(10);
                    else if (ev.shiftKey)
                        this.clock.advanceHour();
                    else
                        this.clock.advanceMinute();
                }
                else {
                    if (ev.ctrlKey)
                        this.clock.revertMinute(10);
                    else if (ev.shiftKey)
                        this.clock.revertHour();
                    else
                        this.clock.revertMinute();
                }
                this.render(true)

                game.settings.set("wfrp4e-rnhd", "clock", { "hour": this.clock._hour, "minute": this.clock._minute }).then(c => { this.broadcastClock() })
            })
        }
    }
}