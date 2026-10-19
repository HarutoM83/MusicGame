using System.IO;
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
        // ★ 1. GameDataHolder から選択された曲のファイル名を取得する
        string jsonFileName = "Test.json"; // 起動直直や直接シーン再生したときの保険
        if (GameDataHolder.Instance != null && !string.IsNullOrEmpty(GameDataHolder.Instance.selectedJsonFileName))
        {
            jsonFileName = GameDataHolder.Instance.selectedJsonFileName;
        }

        // ★ 2. 取得したファイル名を使ってStreamingAssetsからパスを組み立てる
        string path = Path.Combine(Application.streamingAssetsPath, jsonFileName);

        if (File.Exists(path))
        {
            string json = File.ReadAllText(path);
            chart = JsonUtility.FromJson<ChartData>(json);
        }
        else
        {
            Debug.LogError("譜面ファイルが見つかりません: " + path);
            return;
        }

        if (chart != null)
        {
            // 最大コンボ数の設定
            if (ScoreManager.Instance != null)
            {
                ScoreManager.Instance.maxChartCombo = chart.maxPossibleCombo > 0 ? chart.maxPossibleCombo : chart.notes.Count;

                // ScoreManager に AudioSource を登録する
                ScoreManager.Instance.SetAudioSource(music);
            }

            // UIへ曲名や難易度、色彩を反映する
            if (GameUIManager.Instance != null)
            {
                GameUIManager.Instance.SetupUI(chart);
            }
        }
        else
        {
            Debug.LogWarning("chart のパースに失敗しました。");
        }
    }

    public void StartGame()
    {
        gameStarted = true;
        music.Play();
    }

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
        // ノーツのタイプに応じて使用するプールを切り替える
        ObjectPool_Notes targetPool = notesPool;

        if ((data.type == "drag") || (data.grade == "dragex"))
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