using UnityEngine;
using UnityEngine.Playables;

public class TimelineManager : MonoBehaviour
{
    [SerializeField] private PlayableDirector director;
    [SerializeField] private ChartLoader chartLoader;

    void Start()
    {
        director.stopped += OnTimelineFinished;
        director.Play();
    }

    void OnTimelineFinished(PlayableDirector director)
    {
        chartLoader.StartGame();
    }
}
