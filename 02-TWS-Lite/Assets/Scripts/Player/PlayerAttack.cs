using UnityEngine;

public class PlayerAttack : MonoBehaviour
{
    public float attackRange = 2f;

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            EnemyHealth[] enemies =
                FindObjectsByType<EnemyHealth>(
                    FindObjectsSortMode.None
                );

            foreach (EnemyHealth enemy in enemies)
            {
                float distance =
                    Vector3.Distance(
                        transform.position,
                        enemy.transform.position
                    );

                if (distance <= attackRange)
                {
                    enemy.TakeDamage(
                        10,
                        gameObject
                    );

                    SummonCombat[] summons =
                        FindObjectsByType<SummonCombat>(
                            FindObjectsSortMode.None
                        );

                    foreach (SummonCombat summon in summons)
                    {
                        summon.SetTarget(enemy);
                    }
                }
            }
        }
    }
}