using UnityEngine;

public class ShadowHealth : MonoBehaviour
{
    [Header("Health")]
    public int maxHealth = 1000;
    private int currentHealth;

    public bool isDead => currentHealth <= 0;

    // cached reference (SAFE optimization)
    private GameManager gameManager;

    private void Awake()
    {
        gameManager = FindAnyObjectByType<GameManager>();
    }

    private void Start()
    {
        currentHealth = maxHealth;
    }

    public void TakeDamage(int damage, GameObject attacker)
    {
        currentHealth -= damage;

        Debug.Log(gameObject.name + " HP: " + currentHealth);

        OnDamaged(damage, attacker);

        if (currentHealth <= 0)
        {
            Die(attacker);
        }
    }

    // ================= OPTIONAL HOOK =================
    private void OnDamaged(int damage, GameObject attacker)
    {
        // future:
        // - hit reaction
        // - UI update
        // - enemy AI notify
        // - aggro system hook (later phase)
    }

    private void Die(GameObject killer)
    {
        if (gameManager != null)
        {
            gameManager.OnShadowDefeated(gameObject);
        }

        OnDeath(killer);

        Destroy(gameObject);
    }

    // ================= OPTIONAL HOOK =================
    private void OnDeath(GameObject killer)
    {
        // future:
        // - drop soul
        // - capacity refund
        // - animation trigger
    }
}