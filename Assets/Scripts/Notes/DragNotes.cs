using UnityEngine;

public class DragNotes : Notes
{
    private float pressWindow = 0.02f;
    private bool isProcessed = false;

    public override void Initialize(NotesData data, AudioSource audio, ObjectPool_Notes objectPool, Vector3 spawnPos, Vector3 judgePos, float speed)
    {
        base.Initialize(data, audio, objectPool, spawnPos, judgePos, speed);
        isProcessed = false;
    }

    protected override void FixedUpdate()
    {
        base.FixedUpdate(); // 親の移動処理を実行

        if (!music || !music.isPlaying || isProcessed) return;

        float songTime = music.time;

        // 判定ライン到達時に押されていれば自動成功
        if (Mathf.Abs(songTime - hitTime) <= pressWindow)
        {
            if (JudgeManager.Instance != null && JudgeManager.Instance.IsLanePressed(Lane))
            {
                isProcessed = true;
                Release();
            }
        }
        // 通り過ぎたらミス
        else if (songTime > hitTime + pressWindow)
        {
            isProcessed = true;
            Release();
        }
    }
}
