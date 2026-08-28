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
    public Material normalMat;
    public Material EXMat;
    public Renderer sr;
    protected Vector3 spawnPosition;
    protected Vector3 judgePosition;
    public float scrollSpeed;

    public virtual float perfectplusWindow { get; set; } = 0.02f;
    public virtual float perfectWindow { get; set; } = 0.03f;
    public virtual float greatWindow { get; set; } = 0.06f;
    public virtual float goodWindow { get; set; } = 0.09f;
    public virtual float badWindow { get; set; } = 0.12f;


    public float speed = 9f;
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
        scrollSpeed = speed;
        judgeLineZ = judgePos.z;

        if (data.grade == "ex")
        {
            sr.material = EXMat;
        }
        else
        {
            sr.material = normalMat;
        }
    }

    protected virtual void FixedUpdate()
    {
        if (!music.isPlaying)
            return;
        if (pool == null || music == null)
            return;

        float remainTime = hitTime - music.time;

        float distance =
            Vector3.Distance(
                spawnPosition,
                judgePosition
            );

        float totalTime = distance / scrollSpeed;

        float progress =
            1 - (remainTime / totalTime);


        Vector3 pos = transform.position;

        pos.z = 
            spawnPosition.z+
            (judgePosition.z- spawnPosition.z)*
            progress;

        transform.position = pos;


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
    void OnBecameInvisible()
    {
        //Debug.Log("Note Disable " + gameObject.name);
        if (pool != null)
        {
            Release();
        }
    }
}
