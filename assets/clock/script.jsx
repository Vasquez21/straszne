
for (var i = 1; i <= 12; i++)
{
    app.doAction("clock hour", "clock")
    savePNG(i);
}

function savePNG(count)
{
        var pngOptions = new PNGSaveOptions ();
        var path = File("B:\\FVTT-Dev-Data\\Data\\modules\\wfrp4e-rnhd\\assets\\clock\\hour" + count + ".png");
        app.activeDocument.saveAs(path, pngOptions, true, Extension.LOWERCASE);
}