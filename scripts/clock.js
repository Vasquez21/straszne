class WFRP_Clock {
    constructor({hour, minute} = {}) {
        this._hour = hour || 0;
        this._minute = minute || 0;
    }

    get time() {
        let meridian = this._hour >= 12 ? "PM" : "AM"
        return `${this.hour}:${this.minute} ${meridian}`
    }

    get minute() {
        return this._minute < 10 ? "0" + this._minute : this._minute;
    }

    get hour() {
        if (this._hour == 0) return 12
        return this._hour > 12 ? this._hour - 12 : this._hour
    }

    changeTime({hour, minute} = {hour : 0, minute : 0}) {
        this._hour = hour;
        this._minute = minute;
    }

    advanceMinute(addMinutes = 1)
    {
        if (!game.user.isGM)
            return
        if (isNaN(addMinutes))
            return
        else
            addMinutes = Number(addMinutes);

        this._minute += addMinutes;
        if (this._minute >= 60)
        {
            this._minute = this._minute - 60;
            this._hour++
        }
        if (this._hour >= 24)
        {
            this._hour = this._hour - 24;
        }
    }

    advanceHour(addHour = 1)
    {
        if (!game.user.isGM)
            return
        if (isNaN(addHour))
            return
        else
            addHour = Number(addHour);

        this._hour += addHour;
        if (this._hour >= 24)
        {
            this._hour = this._hour - 24;
        }
    }

    
    revertMinute(subMinutes = 1)
    {
        if (!game.user.isGM)
            return
        if (isNaN(subMinutes))
            return
        else
            subMinutes = Number(subMinutes);

        this._minute -= subMinutes;
        if (this._minute < 0)
        {
            this._minute = 60 + this._minute
            this._hour--
        }
        if (this._hour < 0)
        {
            this._hour = 24 + this._hour;
        }
    }


    revertHour(subHour = 1)
    {
        if (!game.user.isGM)
            return
        if (isNaN(subHour))
            return
        else
            subHour = Number(subHour);

        this._hour -= subHour;
        if (this._hour < 0)
        {
            this._hour = 24 + this._hour;
        }
    }

}