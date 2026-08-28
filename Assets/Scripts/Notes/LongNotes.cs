using UnityEngine;

public abstract class LongNotes:Notes
{
    [Header("ホールド・スライド共通設定")]
    public float holdDuration;     // 押している総時間（譜面データから取得するか計算）
    protected float holdTimer = 0f;// 経過時間

    [Header("リカバリー（押し直し）設定")]
    protected bool isHolding = false;
    protected bool isDropped = false;      // 指が離れてしまったフラグ
    protected float dropTimeLimit = 0.15f; // 離しても許される猶予時間（秒）
    protected float dropTimer = 0f;

    [Header("BPMコンボ設定")]
    public float bpm;
    public float tickInterval = 0.1f; // コンボが加算される間隔のベース
    private float tickTimer = 0f;

    public override void Initialize(NotesData data, AudioSource audio, ObjectPool_Notes objectPool, Vector3 spawnPos, Vector3 judgePos, float speed)
    {
        base.Initialize(data, audio, objectPool, spawnPos, judgePos, speed);

        // データのBPMなどを反映（ChartDataから受け取るか、dataに持たせる）
        // 例としてデータから取得、またはデフォルト値
        isHolding = false;
        isDropped = false;
        holdTimer = 0f;
        dropTimer = 0f;
    }

    protected override void FixedUpdate()
    {
        base.FixedUpdate(); // 移動処理は親に任せる

        if (!music || !music.isPlaying) return;

        // 判定ラインに到達したあとの処理
        if (music.time >= hitTime && music.time <= hitTime + holdDuration)
        {
            ProcessHoldLogic();
        }
    }

    // ホールド中の判定と押し直し処理
    protected virtual void ProcessHoldLogic()
    {
        // プレイヤーが今このレーンを押しているかチェック（JudgeManager等から取得）
        bool isPressedNow = JudgeManager.Instance != null && JudgeManager.Instance.IsLanePressed(Lane);

        if (isPressedNow)
        {
            // 押し直せた、または押し続けている場合
            if (isDropped)
            {
                isDropped = false; // 復帰！
                dropTimer = 0f;
            }

            isHolding = true;

            // BPMに応じたコンボ加算処理
            UpdateBpmTick();
        }
        else
        {
            // 押されていない場合（指が離れた）
            if (isHolding && !isDropped)
            {
                isDropped = true; // 離された瞬間
                dropTimer = 0f;
            }

            if (isDropped)
            {
                dropTimer += Time.fixedDeltaTime;
                // 猶予時間を過ぎたらコンボ途切れ（ミス扱いにしてリリース）
                if (dropTimer > dropTimeLimit)
                {
                    OnHoldMiss();
                }
            }
        }
    }

    // BPMに基づくコンボ乗算の刻み処理
    protected virtual void UpdateBpmTick()
    {
        // BPMが早いほど刻みの間隔を短くする（例: BPM120基準からの倍率計算）
        float currentBpm = (bpm > 0) ? bpm : 120f;
        float adjustedInterval = tickInterval * (120f / currentBpm); // BPMが高いと早く刻む

        tickTimer += Time.fixedDeltaTime;
        if (tickTimer >= adjustedInterval)
        {
            tickTimer = 0f;
            OnHoldTick(); // 1回分のコンボ・スコア加算
        }
    }

    // 一定間隔ごとに呼ばれるコンボ加算処理（子クラスでオーバーライド可能）
    protected virtual void OnHoldTick()
    {
        // TODO: JudgeManagerにコンボ＋1を通知する処理など
        Debug.Log("ホールドコンボ加算！");
    }

    // 猶予時間を過ぎて離してしまったときの処理
    protected virtual void OnHoldMiss()
    {
        isHolding = false;
        // TODO: コンボリセットやミス演出
        Release();
    }
}
