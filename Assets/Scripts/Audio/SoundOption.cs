using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Audio;
using UnityEngine.UI;

public class SoundOption : MonoBehaviour
{
    public AudioMixer audioMixer;
    public Slider bgmslider;
    public Slider seslider;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    private void Start()
    {
        audioMixer.GetFloat("BGM_Volume", out float bgmVolume);
        bgmslider.value = bgmVolume;
        audioMixer.GetFloat("SE_Volume", out float seVolume);
        seslider.value = seVolume;
    }

    public void SetBGM(float volume)
    {
        audioMixer.SetFloat("BGM_Volume", volume);
    }

    public void SetSE(float volume)
    {
        audioMixer.SetFloat("SE_Volume", volume);
    }

}
