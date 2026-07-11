using UnityEditor.Experimental.GraphView;
using UnityEngine;

public class Notes : MonoBehaviour
{
    [SerializeField]
    private float resetnotes = -10f;
    private AudioSource music;
    public int Lane;
    public float hitTime;
    public ObjectPool_Notes pool;
    public Material normalMat;
    public Material EXMat;
    public Renderer sr;
    private Vector3 spawnPosition;
    private Vector3 judgePosition;
    private float scrollSpeed;

    public float perfectWindow = 0.05f;
    public float greatWindow = 0.10f;

    public float speed = 9f;
    public float judgeZ = 5f;

    private bool isReleased = false;

    public void Initialize(
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


        if (data.grade == "ex")
        {
            sr.material = EXMat;
        }
        else
        {
            sr.material = normalMat;
        }
    }

    void Update()
    {
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

        pos.z = Mathf.Lerp(
            spawnPosition.z,
            judgePosition.z,
            progress
        );

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
        if (pool != null)
        {
            Release();
        }
    }
}
