using UnityEngine;

public class EnemyHealth : MonoBehaviour
{
    public GameObject SoulPrefab;
    [SerializeField] private int maxHealth = 100;

    private int currentHealth;
    private GameObject lastActtacker;
    private float lastHitTime;

    private EnemySoulDrop enemySoulDrop;

    public bool isDead => currentHealth <= 0;

    private void Start()
    {
        currentHealth = maxHealth;
        enemySoulDrop = GetComponent<EnemySoulDrop>();
    }

    public void TakeDamage(int damage, GameObject attacker)
    {
        // ================= RUNTIME RANK ACTIVATE =================
        if (enemySoulDrop != null)
        {
            enemySoulDrop.ActivateRankIfNeeded();
        }

        lastActtacker = attacker;
        currentHealth -= damage;
        lastHitTime = Time.time;

        // ================= RETARGET TO SHADOW ON HIT =================
        EnemyAI enemyAI = GetComponent<EnemyAI>();

        if (enemyAI != null && attacker != null)
        {
            Debug.Log($"[ENEMY TAKE DAMAGE] attacker = {attacker.name}");

            ShadowHealth shadowHealth = attacker.GetComponent<ShadowHealth>();
            Debug.Log($"[ENEMY TAKE DAMAGE] ShadowHealth found? {shadowHealth != null}");

            if (shadowHealth != null)
            {
                Debug.Log($"[ENEMY TAKE DAMAGE] SetShadowTarget -> {attacker.name}");
                enemyAI.SetShadowTarget(attacker.transform);
            }
        }

        Debug.Log(
            gameObject.name +
            " HP: " +
            currentHealth
        );

        if (currentHealth <= 0)
        {
            Die();
        }
    }

    private void Die()
    {
        Debug.Log(gameObject.name + " died");

        if (lastActtacker != null)
        {
            PlayerLevel player =
                lastActtacker.GetComponent<PlayerLevel>();

            if (player != null)
            {
                player.GainExp(50);
            }

            ShadowLevel shadow =
                lastActtacker.GetComponent<ShadowLevel>();

            if (shadow != null)
            {
                shadow.GainExp(50);
            }
        }

        GameObject droppedSoul =
            Instantiate(
                SoulPrefab,
                transform.position,
                Quaternion.identity
            );

        // ================= SETUP DROPPED SOUL TYPE + RANK =================
        if (enemySoulDrop != null)
        {
            enemySoulDrop.SetupDroppedSoul(droppedSoul);
        }
        else
        {
            Debug.LogWarning(
                $"[EnemyHealth] EnemySoulDrop missing on {gameObject.name}. Soul rank/type won't be set properly."
            );
        }

        Destroy(gameObject);
    }

    public bool IsInCombat()
    {
        return Time.time - lastHitTime < 3f;
    }
}