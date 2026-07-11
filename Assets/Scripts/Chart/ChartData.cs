using System;
using System.Collections.Generic;

[Serializable]
public class NotesData
{
    public float time;
    public int lane;
    public string type;
    public string grade;
    public float scrollSpeed;
}

[Serializable]
public class ChartData
{
    public string title;
    public string artist;
    public float bpm;
    public float offset;
    public float scrollSpeed;

    public List<NotesData> notes;
}