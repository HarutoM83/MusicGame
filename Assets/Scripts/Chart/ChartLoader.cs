using System.IO;
using UnityEditor.Experimental.GraphView;
using UnityEngine;

public class ChartLoader : MonoBehaviour
{
    [SerializeField] private JudgeManager judgeManager;
    [SerializeField] private Transform judgeLine;
    public GameObject TAPNotesPrefab;
    public Transform[] laneSpawnPoints;
    public AudioSource music;
    public ObjectPool_Notes notesPool;

    private ChartData chart;
    private int nextNoteIndex = 0;

    // ”»’èƒ‰ƒCƒ“‚É’…‚­‚Ü‚Å‚ÌŽžŠÔ
    public float spawnOffset = 2.0f;
    public float scrollSpeed = 9f;
    public float travelTime = 2f;

    void Start()
    {
        string path = Path.Combine(Application.streamingAssetsPath, "Song01.json");

        string json = File.ReadAllText(path);

        chart = JsonUtility.FromJson<ChartData>(json);

        music.Play();
    }

    // Update is called once per frame
    void Update()
    {
        if (chart == null) return;

        float songTime = music.time + chart.offset;

        while (nextNoteIndex < chart.notes.Count)
        {
            NotesData notes = chart.notes[nextNoteIndex];

            float distance = Vector3.Distance(
            laneSpawnPoints[notes.lane].position,
            judgeLine.position
            );

            float spawnTime = distance / scrollSpeed;

            if (songTime >= notes.time - spawnTime)
            {
                SpawnNote(notes);
                nextNoteIndex++;
            }
            else
            {
                break;
            }
        }
    }

    void SpawnNote(NotesData data)
    {
        GameObject obj = notesPool.GetObject();

        Notes notes = obj.GetComponent<Notes>();

        Vector3 spawnPos =
        laneSpawnPoints[data.lane].position;

        Vector3 judgePos =
            judgeLine.position;

        obj.transform.position = spawnPos;


        notes.Initialize(
            data,
            music,
            notesPool,
            spawnPos,
            judgePos,
            scrollSpeed
        );

        if (!JudgeManager.Instance.activeNotes.Contains(notes))
        {
            JudgeManager.Instance.activeNotes.Add(notes);
        }
    }

}
