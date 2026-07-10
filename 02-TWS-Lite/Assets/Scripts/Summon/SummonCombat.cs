using UnityEngine;

public class SummonCombat : MonoBehaviour
{
    private enum CombatState
    {
        Idle,
        Chase,
        Attack
    }

    [Header("Settings")]
    public float detectionRange = 8f;
    public float attackRange = 1.5f;
    public float moveSpeed = 4f;
    public float attackCooldown = 1f;
    public int attackDamage = 5;

    [Header("Protection")]
    public float protectPlayerRange = 10f;
    public float maxChaseDistanceFromSummon = 12f;
    public float playerDangerRange = 3f;

    private CombatState state;

    private EnemyHealth currentTarget;
    private Transform player;

    private ShadowLevel shadowLevel;
    private SoulStats soulStats;

    private float nextAttackTime;

    private void Start()
    {
        player = FindAnyObjectByType<PlayerHealth>().transform;
        shadowLevel = GetComponent<ShadowLevel>();
        soulStats = GetComponent<SoulStats>();
    }

    private void Update()
    {
        TickTargetSystem();
        TickStateSystem();
        ExecuteState();
    }

    // ================= TARGET SYSTEM =================

    private void TickTargetSystem()
    {
        if (currentTarget != null && !IsTargetStillValid())
        {
            Debug.Log($"[SUMMON] Clear target -> {currentTarget.name}");
            ClearTarget();
            return;
        }

        if (currentTarget == null)
        {
            AcquireTarget();
        }
    }

    private void AcquireTarget()
    {
        if (soulStats == null) return;

        // Phase 1 rule: Elite only
        if (!IsElite()) return;

        currentTarget = FindDangerZoneEnemy();
    }

    private bool IsElite()
    {
        return soulStats.rank == SoulRank.Elite;
    }

    private bool IsTargetStillValid()
    {
        if (currentTarget == null) return false;
        if (currentTarget.isDead) return false;

        float distToPlayer =
            Vector3.Distance(currentTarget.transform.position, player.position);

        float distToSummon =
            Vector3.Distance(currentTarget.transform.position, transform.position);

        if (distToPlayer > protectPlayerRange)
            return false;

        if (distToSummon > maxChaseDistanceFromSummon)
            return false;

        return true;
    }

    private EnemyHealth FindDangerZoneEnemy()
    {
        EnemyHealth[] enemies =
            FindObjectsByType<EnemyHealth>(FindObjectsSortMode.None);

        EnemyHealth closest = null;
        float minDist = Mathf.Infinity;

        foreach (var e in enemies)
        {
            if (e == null || e.isDead) continue;

            float distToPlayer =
                Vector3.Distance(e.transform.position, player.position);

            if (distToPlayer > playerDangerRange)
                continue;

            float distToSummon =
                Vector3.Distance(transform.position, e.transform.position);

            if (distToSummon < minDist)
            {
                minDist = distToSummon;
                closest = e;
            }
        }

        return closest;
    }

    // ================= STATE SYSTEM =================

    private void TickStateSystem()
    {
        if (currentTarget == null || currentTarget.isDead)
        {
            ClearTarget();
            state = CombatState.Idle;
            return;
        }

        float dist =
            Vector3.Distance(transform.position, currentTarget.transform.position);

        state = (dist <= attackRange)
            ? CombatState.Attack
            : CombatState.Chase;
    }

    // ================= EXECUTION =================

    private void ExecuteState()
    {
        switch (state)
        {
            case CombatState.Idle:
                Idle();
                break;

            case CombatState.Chase:
                Chase();
                break;

            case CombatState.Attack:
                Attack();
                break;
        }
    }

    private void Idle() { }

    private void Chase()
    {
        if (currentTarget == null) return;

        Vector3 dir =
            (currentTarget.transform.position - transform.position).normalized;

        transform.position += dir * moveSpeed * Time.deltaTime;
    }

    private void Attack()
    {
        if (currentTarget == null || currentTarget.isDead)
        {
            ClearTarget();
            return;
        }

        float dist =
            Vector3.Distance(transform.position, currentTarget.transform.position);

        if (dist > attackRange)
        {
            state = CombatState.Chase;
            return;
        }

        if (Time.time < nextAttackTime)
            return;

        int finalDamage =
            attackDamage + shadowLevel.damageBonus;

        currentTarget.TakeDamage(finalDamage, gameObject);

        nextAttackTime = Time.time + attackCooldown;
    }

    // ================= EXTERNAL =================

    public void SetTarget(EnemyHealth target)
    {
        currentTarget = target;
    }

    public void ClearTarget()
    {
        currentTarget = null;
        state = CombatState.Idle;
    }

    public bool HasTarget()
    {
        return currentTarget != null;
    }
}