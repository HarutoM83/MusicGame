using UnityEngine;
using UnityEngine.Playables;

public class TimelineManager : MonoBehaviour
{
    [SerializeField] private PlayableDirector MusicStartDirector;
    [SerializeField] private ChartLoader chartLoader;

    void Start()
    {
        MusicStartDirector.stopped += OnTimelineFinished;
        MusicStartDirector.Play();
    }

    void OnTimelineFinished(PlayableDirector MusicStartDirector)
    {
        chartLoader.StartGame();
    }
    
}
