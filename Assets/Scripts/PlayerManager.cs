using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerManager : MonoBehaviour
{
    public Renderer[] laneRenderer;
    public Material normalMat;
    public Material clickMat;

    private PlayerInput playerInput;

    private void Awake()
    {
        playerInput = GetComponent<PlayerInput>();
    }

    private void OnEnable()
    {
        playerInput.onActionTriggered += OnAction;
    }

    private void OnDisable()
    {
        playerInput.onActionTriggered -= OnAction;
    }
    private void OnAction(InputAction.CallbackContext context)
    {
        if (!context.started) return;

        int index = -1;

        switch (context.action.name)
        {
            case "Attack1": index = 0; break;
            case "Attack2": index = 1; break;
            case "Attack3": index = 2; break;
            case "Attack4": index = 3; break;
            case "Attack5": index = 4; break;
            case "Attack6": index = 5; break;
            case "Attack7": index = 6; break;
            case "Attack8": index = 7; break;
        }

        if (index < 0) return;

        HitLane(index);
    }

    void HitLane(int index)
    {
        laneRenderer[index].material = clickMat;
        Invoke(nameof(ResetAll), 0.1f);
    }

    void ResetAll()
    {
        for (int i = 0; i < laneRenderer.Length; i++)
        {
            laneRenderer[i].material = normalMat;
        }
    }
}
