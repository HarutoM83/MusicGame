using UnityEngine;
using System.IO;

public class ChartLoader : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        string path = Path.Combine(Application.streamingAssetsPath, "song00.json");

        string json = File.ReadAllText(path);

        ChartData chart = JsonUtility.FromJson<ChartData>(json);

        Debug.Log(chart.title);

        foreach (NoteData note in chart.notes)
        {
            Debug.Log($"Time:{note.time} Lane:{note.lane}");
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
