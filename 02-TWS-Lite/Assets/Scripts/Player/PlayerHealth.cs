using UnityEngine;
using TMPro;


public class PlayerHealth : MonoBehaviour
{
    public TMP_Text hpText;
    [SerializeField] private int maxHealth = 100;
    
    private int currentHealth;
    
    public float HealthPercent
    {
        get
        {
            return (float)currentHealth / maxHealth;
        }
    }

    private void Start()
    {
        currentHealth = maxHealth;
        hpText.text = "Player HP: " + currentHealth;
    }

    public void TakeDamage(
    int damage,
    GameObject attacker
)
{
    currentHealth -= damage;

    hpText.text =
        "Player HP: " +
        currentHealth;

    Debug.Log(
        gameObject.name +
        " HP: " +
        currentHealth
    );

    EnemyHealth enemy =
        attacker.GetComponent<EnemyHealth>();

    if (enemy != null)
    {
        SummonCombat[] summons =
            FindObjectsByType<SummonCombat>(
                FindObjectsSortMode.None
            );

        foreach (SummonCombat summon in summons)
        {
            summon.SetTarget(enemy);
        }
    }

    if (currentHealth <= 0)
    {
        Die();
    }
}

   /* private void Update()
    {
        if (Input.GetKeyDown(KeyCode.K))
        {
            TakeDamage(10);
        }
    }*/

    private void Die()
    {
        Debug.Log(gameObject.name + " died");
        Destroy(gameObject);
    }
}