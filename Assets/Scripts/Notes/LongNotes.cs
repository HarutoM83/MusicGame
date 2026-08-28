using UnityEngine;

public abstract class LongNotes:Notes
{

    [Header("ホールド・スライド共通設定")]
    public float holdDuration;      // 押している総時間
    protected float holdTimer = 0f; // 経過時間

    [Header("リカバリー（押し直し）設定")]
    protected bool isHolding = false;
    protected bool isDropped = false;      // 指が離れてしまったフラグ
    protected float dropTimeLimit = 0.15f; // 離しても許される猶予時間（秒）
    protected float dropTimer = 0f;

    [Header("BPMコンボ設定")]
    public float bpm;
    public float tickInterval = 0.1f; // コンボが加算される間隔のベース
    private float tickTimer = 0f;

    [Header("LineRenderer設定（ロングノーツの帯）")]
    [SerializeField] private LineRenderer lineRenderer;

    public override void Initialize(NotesData data, AudioSource audio, ObjectPool_Notes objectPool, Vector3 spawnPos, Vector3 judgePos, float speed)
    {
        base.Initialize(data, audio, objectPool, spawnPos, judgePos, speed);

        isHolding = false;
        isDropped = false;
        holdTimer = 0f;
        dropTimer = 0f;
        tickTimer = 0f;

        // holdDurationがデータから取得できる場合はここで代入（例: data.holdDuration など）
        // holdDuration = data.holdDuration;

        // LineRendererの初期化
        if (lineRenderer != null)
        {
            lineRenderer.positionCount = 2; // 始点と終点の2点
        }
    }

    protected override void FixedUpdate()
    {
        base.FixedUpdate(); // 親の移動処理（ヘッドの移動）を実行

        if (!music || !music.isPlaying) return;

        // --- LineRenderer の描画更新 ---
        UpdateLineRenderer();

        // 判定ラインに到達したあとの処理
        if (music.time >= hitTime && music.time <= hitTime + holdDuration)
        {
            ProcessHoldLogic();
        }

        // ホールド終了時間を過ぎたらプールに返却
        if (music.time > hitTime + holdDuration)
        {
            Release();
        }
    }

    /// <summary>
    /// LineRendererの始点（ヘッド）と終点（テイル）の位置を毎フレーム計算して更新する
    /// </summary>
    private void UpdateLineRenderer()
    {
        if (lineRenderer == null) return;

        // 1. 始点（ヘッド）の現在地
        Vector3 headPos = transform.position;

        // 2. 終点（テイル）の現在地を計算
        // テイルが判定ラインに到達する時間は「hitTime + holdDuration」
        float tailHitTime = hitTime + holdDuration;
        float remainTailTime = tailHitTime - music.time;

        // 始点から判定ラインまでの距離と時間から、スピードを逆算
        float distance = Vector3.Distance(spawnPosition, judgePosition);
        float totalTime = distance / scrollSpeed;

        // テイルの進捗率を計算
        float tailProgress = 1f - (remainTailTime / totalTime);

        // 3D空間上のテイルの位置を計算（ヘッドと同じ移動経路上に配置）
        Vector3 tailPos = spawnPosition + (judgePosition - spawnPosition) * tailProgress;

        // もし「ヘッドがすでに判定ラインに到達して止まっている」場合の処理：
        // ヘッドが判定ラインを超えて進まないようにしている場合、ヘッドの位置を固定してテイル側が縮むように表現することも可能です。
        if (headPos.z < judgePosition.z)
        {
            // ヘッドがまだ判定ライン手前ならそのまま
        }
        else
        {
            // ヘッドが判定ラインに到達した後は、ヘッドの位置を判定ラインに固定（必要に応じて）
            // headPos = judgePosition; 
        }

        // LineRendererに座標を反映
        lineRenderer.SetPosition(0, headPos);  // 0番：ヘッド（先端）
        lineRenderer.SetPosition(1, tailPos);  // 1番：テイル（終端）
    }

    // ホールド中の判定と押し直し処理
    protected virtual void ProcessHoldLogic()
    {
        bool isPressedNow = JudgeManager.Instance != null && JudgeManager.Instance.IsLanePressed(Lane);

        if (isPressedNow)
        {
            if (isDropped)
            {
                isDropped = false;
                dropTimer = 0f;
            }

            isHolding = true;
            UpdateBpmTick();
        }
        else
        {
            if (isHolding && !isDropped)
            {
                isDropped = true;
                dropTimer = 0f;
            }

            if (isDropped)
            {
                dropTimer += Time.fixedDeltaTime;
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
        float currentBpm = (bpm > 0) ? bpm : 120f;
        float adjustedInterval = tickInterval * (120f / currentBpm);

        tickTimer += Time.fixedDeltaTime;
        if (tickTimer >= adjustedInterval)
        {
            tickTimer = 0f;
            OnHoldTick();
        }
    }

    protected virtual void OnHoldTick()
    {
        Debug.Log("ホールドコンボ加算！");
    }

    protected virtual void OnHoldMiss()
    {
        isHolding = false;
        Release();
    }
}
