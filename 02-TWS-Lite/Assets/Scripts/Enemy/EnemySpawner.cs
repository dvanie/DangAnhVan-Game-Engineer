using UnityEngine;

public class EnemySpawner : MonoBehaviour
{
    public GameObject enemyPrefab;

    public float respawnTime = 10f;

    private GameObject currentEnemy;

    private void Start()
    {
        SpawnEnemy();
    }

    private void Update()
    {
        if (currentEnemy == null)
        {
            respawnTime -= Time.deltaTime;

            if (respawnTime <= 0)
            {
                SpawnEnemy();

                respawnTime = 10f;
            }
        }
    }

    private void SpawnEnemy()
    {
        currentEnemy =
            Instantiate(
                enemyPrefab,
                transform.position,
                Quaternion.identity
            );
    }
}