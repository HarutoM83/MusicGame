using UnityEditor.Experimental.GraphView;
using UnityEngine;

public class Notes : MonoBehaviour
{
    private AudioSource music;
    public int Lane;
    public float hitTime;
    public ObjectPool_Notes pool;
    public Material normalMat;
    public Material EXMat;
    public Renderer sr;

    public float perfectWindow = -0.6f;
    public float greatWindow = -0.7f;

    public float speed = 9f;
    public float judgeZ = 5f;

    public void Initialize(
    NotesData data,
    AudioSource audio,
    ObjectPool_Notes objectPool,
    float spawnZ,
    float judgeZ,
    float travelTime)
    {
        hitTime = data.time;
        music = audio;
        pool = objectPool;

        Lane = data.lane;

        this.judgeZ = judgeZ;

        float distance = Mathf.Abs(spawnZ - judgeZ);
        speed = distance / travelTime;

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
        if (pool == null)
            return;

        float t = hitTime - music.time;

        transform.position = new Vector3(
            transform.position.x,
            transform.position.y,
            judgeZ + t * speed
        );

        if (t < -0.2f)
        {
            pool.ReleaseObject(gameObject);
        }
    }

    void OnDisable()
    {
        if (JudgeManager.Instance != null)
            JudgeManager.Instance.activeNotes.Remove(this);
    }
}
