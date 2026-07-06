using System.IO;
using UnityEditor.Experimental.GraphView;
using UnityEngine;

public class ChartLoader : MonoBehaviour
{
    [SerializeField] private JudgeManager judgeManager;
    public GameObject TAPNotesPrefab;
    public Transform[] laneSpawnPoints;
    public AudioSource music;
    public ObjectPool_Notes notesPool;

    private ChartData chart;
    private int nextNoteIndex = 0;

    // ”»’èƒ‰ƒCƒ“‚É’…‚­‚Ü‚Å‚ÌŽžŠÔ
    public float spawnOffset = 2.0f;

    public float spawnZ = 10f;
    public float judgeZ = 5f;
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

            if (songTime >= notes.time - spawnOffset)
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

        obj.transform.position = laneSpawnPoints[data.lane].position;
        obj.transform.rotation = Quaternion.identity;

        Notes notes = obj.GetComponent<Notes>();

        notes.Initialize(
            data,
            music,
            notesPool,
            spawnZ,
            judgeZ,
            travelTime
        );

        JudgeManager.Instance.activeNotes.Add(notes);
    }

}
