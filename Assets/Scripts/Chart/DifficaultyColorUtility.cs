using System;
using UnityEngine;

// クラス名が「DifficultyColorDatabase」であること
[CreateAssetMenu(fileName = "DifficultyColorDatabase", menuName = "Game/Difficulty Color Database")]
public class DifficultyColorDatabase : ScriptableObject
{
    [System.Serializable]
    public struct DifficultyColorData
    {
        public string difficultyName;
        public Color color;
    }

    [SerializeField] private DifficultyColorData[] colorList;

    public Color GetColor(string difficulty)
    {
        if (string.IsNullOrEmpty(difficulty)) return Color.white;

        string target = difficulty.ToLower();
        foreach (var data in colorList)
        {
            if (data.difficultyName.ToLower() == target)
            {
                return data.color;
            }
        }
        return Color.white;
    }
}