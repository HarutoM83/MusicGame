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
    [SerializeField] private ObjectPool_Notes notesPool;
    [SerializeField] private ObjectPool_Notes dragnotesPool;

    private ChartData chart;
    private int nextNoteIndex = 0;

    // 判定ラインに着くまでの時間
    public float spawnOffset = 2.0f;
    public float scrollSpeed = 9f;
    public float travelTime = 2f;

    private bool gameStarted = false;

    void Start()
    {
        string path = Path.Combine(Application.streamingAssetsPath, "Song01.json");

        string json = File.ReadAllText(path);

        chart = JsonUtility.FromJson<ChartData>(json);
    }
    public void StartGame()
    {
        gameStarted = true;
        music.Play();
    }
    // Update is called once per frame
    void Update()
    {
        if (!gameStarted)
            return;
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
        void SpawnNote(NotesData data)
        {
            // 例: ノーツのタイプに応じて使用するプールを切り替える
            ObjectPool_Notes targetPool = notesPool;

            if (data.type == "Long") // チャートデータの仕様に合わせて条件を変更してください
            {
                targetPool = dragnotesPool;
            }

            GameObject obj = targetPool.GetObject();
            Notes notes = obj.GetComponent<Notes>();

            Vector3 spawnPos = laneSpawnPoints[data.lane].position;
            Vector3 judgePos = judgeLine.position;

            obj.transform.position = spawnPos;

            // 取得したプールの参照を渡すことで、Notes.Release() が正しいプールに返却する
            notes.Initialize(
                data,
                music,
                targetPool,
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

}
