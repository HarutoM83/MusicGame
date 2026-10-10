using UnityEngine;

public static class DifficultyColorUtility
{
    // 難易度文字列に応じたカラーを返すメソッド
    public static Color GetDifficultyColor(string difficulty)
    {
        // 小文字に統一して判定すると安全
        switch (difficulty.ToLower())
        {
            case "easy":
                return new Color(0.2f, 0.6f, 1.0f, 1.0f);   // 水色・青
            case "normal":
                return new Color(0.2f, 0.8f, 0.3f, 1.0f);   // 緑
            case "hard":
                return new Color(1.0f, 0.6f, 0.0f, 1.0f);   // オレンジ
            case "expert":
                return new Color(0.9f, 0.1f, 0.2f, 1.0f);   // 赤
            case "master":
                return new Color(0.7f, 0.2f, 0.9f, 1.0f);   // 紫
            default:
                return Color.white;                        // その他・デフォルト

        }
    }
}
