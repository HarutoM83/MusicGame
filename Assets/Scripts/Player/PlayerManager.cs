using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Rendering;

public class PlayerManager : MonoBehaviour
{
    [SerializeField] private JudgeManager judgeManager;
    public Renderer[] laneRenderer;
    public Material normalMat;
    public Material clickMat;

    public void OnAttack1(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(0);
        if (context.canceled)
        {
            laneRenderer[0].material = normalMat;
        }
    }

    public void OnAttack2(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(1);
        if (context.canceled)
        {
            laneRenderer[1].material = normalMat;
        }
    }

    public void OnAttack3(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(2);
        if (context.canceled)
        {
            laneRenderer[2].material = normalMat;
        }
    }

    public void OnAttack4(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(3);
        if (context.canceled)
        {
            laneRenderer[3].material = normalMat;
        }
    }

    public void OnAttack5(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(4);
        if (context.canceled)
        {
            laneRenderer[4].material = normalMat;
        }
    }

    public void OnAttack6(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(5);
        if (context.canceled)
        {
            laneRenderer[5].material = normalMat;
        }
    }

    public void OnAttack7(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(6);
        if (context.canceled)
        {
            laneRenderer[6].material = normalMat;
        }
    }

    public void OnAttack8(InputAction.CallbackContext context)
    {
        if (context.started) HitLane(7);
        if (context.canceled)
        {
            laneRenderer[7].material = normalMat;
        }
    }

    void HitLane(int index)
    {
        laneRenderer[index].material = clickMat;

        if (judgeManager == null)
        {
            Debug.LogError("JudgeManager is not assigned!");
            return;
        }

        judgeManager.Judge(index);
    }

}
