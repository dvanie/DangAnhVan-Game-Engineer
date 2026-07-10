using UnityEngine;
using TMPro;

public class SoulObject : MonoBehaviour
{
    public SoulType soulType;
    public SoulRank soulRank;
    public TMP_Text extractText;

    public float lifeTime = 5f;
    private float timer;
    
    public bool isAutoCollect = true;
    public bool canExtract = false;
    public float extractRange = 2f;
    private Transform player;

    public float startVacuumRange = 5f;
    public float vacuumSpeed = 8f;
    public float acceleration = 5f;
    private float currentSpeed;
    
    private bool collected = false;
    private bool isExtracting = false;
    

    private void Start()
    {
        currentSpeed = 0f;
        player = GameObject.FindGameObjectWithTag("Player").transform;
    }

    private void Update()
    {
        HandleLifetime();

        if (collected) return;

        if (isAutoCollect && soulRank == SoulRank.Common)
        {
            HandleAutoCollect();
        }
        else
        {
            HandleManualExtract();
        }
    }
    private void HandleLifetime()
    {
        timer += Time.deltaTime;

        if (timer >= lifeTime)
        {
            Expire();
        }
    }
    
    private void HandleAutoCollect()
    {
        float dist = Vector3.Distance(transform.position, player.position);

        if (dist < startVacuumRange)
        {
            currentSpeed += acceleration * Time.deltaTime;

            transform.position = Vector3.Lerp(
                transform.position,
                player.position,
                Time.deltaTime * currentSpeed
            );
        }

        if (dist < 0.5f)
        {
            GameManager gm = FindObjectOfType<GameManager>();
            gm.AddMite(1);

            collected = true;
            Destroy(gameObject);
        }
    }
    
    private void HandleManualExtract()
    {
        
        float dist = Vector3.Distance(transform.position, player.position);
        
        canExtract = dist <= extractRange;
        
        // INPUT FIRST (quan trọng)
        if (canExtract && Input.GetKeyDown(KeyCode.E))
        {
            Debug.Log("Extraction");
            Extract();
            return;
        }

        // UI SAFE CHECK
        if (extractText != null)
        {
            extractText.text = canExtract ? "Press E to Extract" : "";
        }
    }
    
    public void Extract()
    {
        if (collected || isExtracting ) return;

        isExtracting = true;

        StartCoroutine(ExtractRoutine());
    }
    
    private System.Collections.IEnumerator ExtractRoutine()
    {
        GameManager gm = FindObjectOfType<GameManager>();

        float t = 0f;
        float duration = 0.6f;

        Vector3 startPos = transform.position;

        while (t < duration)
        {
            t += Time.deltaTime;

            float progress = t / duration;

            // pull toward player with curve
            transform.position = Vector3.Lerp(
                startPos,
                player.position,
                progress
            );

            // optional: scale down feel
            transform.localScale = Vector3.Lerp(
                Vector3.one,
                Vector3.zero,
                progress
            );

            yield return null;
        }

        // FINAL REWARD
        if (soulRank == SoulRank.Common)
        {
            gm.AddMite(1);
        }
        else
        {
            gm.AddSoul(soulType, soulRank);
        }

        Destroy(gameObject);
    }

    public void StartVacuum(System.Action onReachPlayer)
    {
        collected = true;

        StartCoroutine(VacuumRoutine(onReachPlayer));
    }

    private System.Collections.IEnumerator VacuumRoutine(System.Action onReachPlayer)
    {
        while (Vector3.Distance(transform.position, player.position) > 0.5f)
        {
            transform.position = Vector3.Lerp(
                transform.position,
                player.position,
                Time.deltaTime * 8f
            );

            yield return null;
        }

        onReachPlayer?.Invoke();

        Destroy(gameObject);
    }

    private void Expire()
    {
        Destroy(gameObject);
    }
}
