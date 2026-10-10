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
    public string title;//曲名
    public string artist;
    public float bpm;
    public string difficulty; // 難易度指定
    public int level;         // 難易度レベル 5, 10, 12 など
    public string chartDesigner;　//ノーツデザイナー名
    public float offset;
    public float scrollSpeed;
    public int maxPossibleCombo;

    public List<NotesData> notes;
}