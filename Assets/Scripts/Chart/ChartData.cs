using System;
using System.Collections.Generic;

[Serializable]
public class NoteData
{
    public float time;
    public int lane;
    public string type;
}

[Serializable]
public class ChartData
{
    public string title;
    public string artist;
    public float bpm;
    public float offset;

    public List<NoteData> notes;
}