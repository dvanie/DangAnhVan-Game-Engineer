using UnityEngine;

public class SummonFollow : MonoBehaviour
{
    public Transform player;

    public float followDistance = 2f;

    public float moveSpeed = 4f;
    public Vector3 followOffset;
    private SummonCombat summonCombat;

    private void Update()
    {
        if (summonCombat.HasTarget())
        {
            return;
        }
        float distance =
            Vector3.Distance(
                transform.position,
                player.position
            );

        if (distance > followDistance)
        {
            Vector3 targetPosition =
                player.position +
                followOffset;

            Vector3 direction =
                targetPosition -
                transform.position;

            transform.position +=
                direction.normalized *
                moveSpeed *
                Time.deltaTime;
        }
    }
    private void Start()
    {
        player = GameObject.FindAnyObjectByType<PlayerHealth>().transform;

        summonCombat = GetComponent<SummonCombat>();
    }
}