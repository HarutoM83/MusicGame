using UnityEngine;
using UnityEngine.Pool;

public class ObjectPool_Notes : MonoBehaviour
{
    ObjectPool<GameObject> pool;    // オブジェクトプールの変数を宣言
    public GameObject obj;  // プールの中で管理したいオブジェクト

    void Start()
    {
        // オブジェクトプールのインスタンスを生成
        pool = new ObjectPool<GameObject>(
            CreatePooledItem,        // オブジェクト生成の際の処理
            OnTakeFromPool,          // オブジェクトを取り出す際の処理
            OnReturnedToPool,        // オブジェクトを返却する際の処理
            OnDestroyPoolObject,     // プールが上限を超えた場合の処理
            true,                    // すでにプール内にいるオブジェクトを返却した際にエラー表示するか
            2,                       // 初期のプールの容量
            20);                     // プール内オブジェクトの上限数
    }

    // オブジェクト生成の際の処理
    GameObject CreatePooledItem()
    {
        return Instantiate(obj);    // オブジェクトを生成してプールに渡す処理
    }

    // オブジェクトを取り出す際の処理 ---
    void OnTakeFromPool(GameObject pooledObj)
    {
        pooledObj.SetActive(true);    // オブジェクトをアクティブにする処理

        // プールから取り出されたノーツがJudgeManagerのリストに登録されるようにする
        Notes note = pooledObj.GetComponent<Notes>();
        if (note != null && JudgeManager.Instance != null)
        {
            if (!JudgeManager.Instance.activeNotes.Contains(note))
            {
                JudgeManager.Instance.activeNotes.Add(note);
            }
        }
    }
    // ----------------------------------------------------

    // オブジェクトを返却する際の処理
    void OnReturnedToPool(GameObject pooledObj)
    {
        pooledObj.SetActive(false);   // オブジェクトを非アクティブにする処理
    }

    // プールが上限を超えた場合の処理
    void OnDestroyPoolObject(GameObject pooledObj)
    {
        Destroy(pooledObj);    // オブジェクトを破壊する処理
    }

    // 他のクラスからオブジェクトを取り出せるようにするためのメソッド
    public GameObject GetObject()
    {
        return pool.Get();  // プールからオブジェクトを取り出す処理
    }

    // 他のクラスからオブジェクトを返却できるようにするためのメソッド
    public void ReleaseObject(GameObject pooledObj)
    {
        pool.Release(pooledObj);  // プールにオブジェクトを返却する処理
    }
}