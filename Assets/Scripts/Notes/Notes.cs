using UnityEditor.Experimental.GraphView;
using UnityEngine;

public abstract class Notes : MonoBehaviour
{
    [SerializeField]
    private float resetnotes = -10f;
    protected AudioSource music;
    public int Lane;
    public float hitTime;
    public ObjectPool_Notes pool;

    [Header("ノーツごとのマテリアル設定")]
    public Material normalMat;
    public Material normalLaneMat;
    public Material EXMat;
    public Material skynotesMat;
    public Material skynotesLaneMat;
    public Renderer sr;
    public Renderer[] srl;

    protected Vector3 spawnPosition;
    protected Vector3 judgePosition;
    public float scrollSpeed;

    public virtual float perfectplusWindow { get; set; } = 0.02f;
    public virtual float perfectWindow { get; set; } = 0.03f;
    public virtual float greatWindow { get; set; } = 0.06f;
    public virtual float goodWindow { get; set; } = 0.09f;
    public virtual float badWindow { get; set; } = 0.12f;

    public float speed = 10f;
    public float judgeZ = 5f;
    public float judgeLineZ;

    private bool isReleased = false;

    public virtual void Initialize(
        NotesData data,
        AudioSource audio,
        ObjectPool_Notes objectPool,
        Vector3 spawnPos,
        Vector3 judgePos,
        float speed)
    {
        isReleased = false;
        hitTime = data.time;
        music = audio;
        pool = objectPool;

        Lane = data.lane;

        spawnPosition = spawnPos;
        judgePosition = judgePos;

        // ★【重要】プールから取り出した瞬間に必ずスポーン位置に配置（瞬間移動対策）
        transform.position = spawnPosition;

        scrollSpeed = speed;
        judgeLineZ = judgePos.z;

        // JudgeManagerのリストに登録
        if (JudgeManager.Instance != null)
        {
            if (!JudgeManager.Instance.activeNotes.Contains(this))
            {
                JudgeManager.Instance.activeNotes.Add(this);
            }
        }

        // マテリアル切替
        if (data.type == "tap")
        {
            sr.material = normalMat;
            for (int i = 0; i < srl.Length; i++) srl[i].material = normalLaneMat;
        }
        else if (data.grade == "ex")
        {
            sr.material = EXMat;
        }
        else if (data.grade == "drag")
        {
            sr.material = normalMat;
            for (int i = 0; i < srl.Length; i++) srl[i].material = normalLaneMat;
        }
        else if (data.grade == "dragex")
        {
            sr.material = EXMat;
        }
        else if (data.type == "sky")
        {
            sr.material = skynotesMat;
            for (int i = 0; i < srl.Length; i++) srl[i].material = skynotesLaneMat;
        }
    }

    protected virtual void FixedUpdate()
    {
        if (music == null || !music.isPlaying)
            return;
        if (pool == null)
            return;

        float songTime = music.time;
        float remainTime = hitTime - songTime;

        float distance = Vector3.Distance(spawnPosition, judgePosition);
        float totalTime = distance / scrollSpeed;

        if (totalTime <= 0f) totalTime = 0.001f;

        float progress = 1 - (remainTime / totalTime);

        Vector3 pos = transform.position;
        pos.z = spawnPosition.z + (judgePosition.z - spawnPosition.z) * progress;
        transform.position = pos;

        // ★★★ ここを復活させる：指定したZ座標（resetnotes）より手前に来たらプールに戻す ★★★
        if (transform.position.z < resetnotes)
        {
            Release();
        }
    }

    public void Release()
    {
        if (isReleased)
            return;

        isReleased = true;
        pool.ReleaseObject(gameObject);
    }

    void OnDisable()
    {
        if (JudgeManager.Instance != null)
        {
            JudgeManager.Instance.activeNotes.Remove(this);
        }
    }
}