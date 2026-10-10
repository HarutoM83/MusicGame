using System.IO;
using UnityEditor.Experimental.GraphView;
using UnityEngine;

public class ChartLoader : MonoBehaviour
{
    [SerializeField] private JudgeManager judgeManager;
    [SerializeField] private Transform judgeLine;
    public GameObject TAPNotesPrefab;
    public GameObject DragNotesPrefab;
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
        string path = Path.Combine(Application.streamingAssetsPath, "Test.json");

        string json = File.ReadAllText(path);

        chart = JsonUtility.FromJson<ChartData>(json);

        // ChartLoader.cs の Start内に追加        chart = JsonUtility.FromJson<ChartData>(json);

        if (chart != null)
        {
            // 最大コンボ数の設定
            if (ScoreManager.Instance != null)
            {
                ScoreManager.Instance.maxChartCombo = chart.maxPossibleCombo > 0 ? chart.maxPossibleCombo : chart.notes.Count;
            }

            // ★ UIへ曲名や難易度、色彩を反映する
            if (GameUIManager.Instance != null)
            {
                GameUIManager.Instance.SetupUI(chart);
            }
        }

        // ★ ここでJSONから読み込んだ最大コンボ数を ScoreManager にセットする
        if (ScoreManager.Instance != null && chart != null)
        {
            ScoreManager.Instance.maxChartCombo = chart.maxPossibleCombo;

            // 【保険】もし古いJSONなどで maxPossibleCombo が 0 になっている場合は、
            // 自動的にノーツの数（notes.Count）を代入するようにしておくと安全です
            if (chart.maxPossibleCombo == 0 && chart.notes != null)
            {
                ScoreManager.Instance.maxChartCombo = chart.notes.Count;
            }
        }
        else
        {
            Debug.LogWarning("ScoreManager.Instance または chart が見つかりませんでした。");
        }

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
        // 例: ノーツのタイプに応じて使用するプールを切り替える
        ObjectPool_Notes targetPool = notesPool;

        if ((data.type == "drag")|| (data.grade == "dragex"))// チャートデータの仕様に合わせて条件を変更してください
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
