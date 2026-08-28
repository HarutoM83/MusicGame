using UnityEngine;

public class HoldNotes : LongNotes
{
    protected override void OnHoldTick()
    {
        base.OnHoldTick();
        // ここでホールド中のエフェクトを出したりできる
    }
}
