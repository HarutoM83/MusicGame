using UnityEngine;

public class TAPNotes : Notes
{
    // EX用の場合の判定ウィンドウを定義
    [Header("EX Note Windows")]
    public float exPerfectPlusWindow = 0.02f;
    public float exPerfectWindow = 0.06f;
    public float exGreatWindow = 0.08f;
    public float exGoodWindow = 0.10f;
    public float exBadWindow = 0.12f;

    public override void Initialize(
        NotesData data,
        AudioSource audio,
        ObjectPool_Notes objectPool,
        Vector3 spawnPos,
        Vector3 judgePos,
        float speed)
    {
        // 親クラス（Notes）の初期化処理を呼ぶ
        base.Initialize(data, audio, objectPool, spawnPos, judgePos, speed);

        // EX化している場合の判定変更処理
        if (data.grade == "ex")
        {
            // 例：EXノーツ専用の判定幅に上書きする
            perfectplusWindow = exPerfectPlusWindow;
            perfectWindow = exPerfectWindow;
            greatWindow = exGreatWindow;
            goodWindow = exGoodWindow;
            badWindow = exBadWindow;
        }
    }
}
