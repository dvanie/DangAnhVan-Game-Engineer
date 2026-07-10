using UnityEngine;



public class EnemyAI : MonoBehaviour

{

    private Transform player;

    private PlayerHealth playerHealth;

    private EnemyHealth enemyHealth;
    

    private Transform currentShadowTarget;

    public float detectionRange = 8f;

    public float moveSpeed = 3f;

    public float stopDistance = 1.5f;



    public float leashDistance = 12f;

    public int attackDamage = 10;

    public float attackCooldown = 1f;



    private float nextAttackTime;

    private Vector3 spawnPosition;



    private bool isChasingPlayer;

    private bool isSearching;

    private float searchStartTime;

    private bool isReturningHome;



    public bool isControlledBySummon = false;



    private bool searchTriggered;



    private void Start()

    {

        playerHealth = FindAnyObjectByType<PlayerHealth>();

        player = playerHealth.transform;



        enemyHealth = GetComponent<EnemyHealth>();

        spawnPosition = transform.position;

    }



    private void Update()

    {

        float distToPlayer =

            Vector3.Distance(transform.position, player.position);



        float playerDistanceFromSpawn =

            Vector3.Distance(player.position, spawnPosition);



        if (

            distToPlayer <= detectionRange

            &&

            playerDistanceFromSpawn <= leashDistance

        )

        {

            isChasingPlayer = true;

        }



        float distFromSpawn =

            Vector3.Distance(transform.position, spawnPosition);



        // ================= RETURN HOME =================

        if (isReturningHome)

        {

            if (

                distToPlayer <= detectionRange

                &&

                playerDistanceFromSpawn <= leashDistance

            )

            {

                isReturningHome = false;

                searchTriggered = false;

                return;

            }



            MoveToSpawn();



            if (distFromSpawn < 0.3f)

            {

                isReturningHome = false;

                searchTriggered = false;

                isChasingPlayer = false;

                currentShadowTarget = null;

            }



            return;

        }



        // ================= SEARCH =================

        if (isSearching)

        {

            if (

                distToPlayer <= detectionRange

                &&

                playerDistanceFromSpawn <= leashDistance

            )

            {

                isSearching = false;

                searchTriggered = false;

                return;

            }



            if (Time.time - searchStartTime >= 1.5f)

            {

                isSearching = false;

                isReturningHome = true;

                isChasingPlayer = false;

                currentShadowTarget = null;

            }



            return;

        }



        // ================= ENTER SEARCH =================

        if (

            !searchTriggered

            &&

            playerDistanceFromSpawn > leashDistance

        )

        {

            isSearching = true;

            searchTriggered = true;

            searchStartTime = Time.time;

            currentShadowTarget = null;

            return;

        }



        // ================= HARD LEASH =================

        if (distFromSpawn > leashDistance && !isSearching && !isReturningHome)

        {

            isSearching = true;

            searchStartTime = Time.time;

            searchTriggered = true;

            currentShadowTarget = null;

            return;

        }



        // ================= COMBAT =================

        if (isChasingPlayer)

        {

            HandleCombat();

        }

    }



    private void HandleCombat()

    {

        // Nếu target shadow không còn hợp lệ -> quay về player

        if (!IsShadowTargetValid())

        {

            currentShadowTarget = null;

        }



        // ================= SHADOW TARGET =================

        if (currentShadowTarget != null)

        {

            float shadowDist =

                Vector3.Distance(transform.position, currentShadowTarget.transform.position);



            if (shadowDist > stopDistance)

            {

                MoveTo(currentShadowTarget.transform.position);

            }

            else

            {

                AttackShadow();

            }



            return;

        }



        // ================= PLAYER FALLBACK =================

        float playerDist =

            Vector3.Distance(transform.position, player.position);



        if (playerDist > stopDistance)

        {

            MoveTo(player.position);

        }

        else

        {

            AttackPlayer();

        }

    }



    private bool IsShadowTargetValid()
    {
        if (currentShadowTarget == null)
            return false;

        ShadowHealth shadowHealth =
            currentShadowTarget.GetComponent<ShadowHealth>();

        if (shadowHealth == null)
            return false;

        if (shadowHealth.isDead)
            return false;

        return true;
    }



    private void MoveTo(Vector3 target)

    {

        Vector3 dir = (target - transform.position).normalized;

        transform.position += dir * moveSpeed * Time.deltaTime;

    }



    private void MoveToSpawn()

    {

        MoveTo(spawnPosition);

    }



    private void AttackPlayer()

    {

        if (Time.time < nextAttackTime) return;



        Debug.Log("Enemy Attack Player");



        playerHealth.TakeDamage(attackDamage, gameObject);



        nextAttackTime = Time.time + attackCooldown;

    }



    private void AttackShadow()
    {
        if (currentShadowTarget == null) return;
        if (Time.time < nextAttackTime) return;

        Debug.Log("Enemy Attack Shadow");

        currentShadowTarget.GetComponent<ShadowHealth>()?.TakeDamage(attackDamage, gameObject);

        nextAttackTime = Time.time + attackCooldown;
    }



    // ================= EXTERNAL =================



    public void SetShadowTarget(Transform shadow)
    {
        if (shadow == null) return;

        currentShadowTarget = shadow;
        Debug.Log($"[EnemyAI] currentShadowTarget set to {shadow.name}");
    }
    
    public void ClearShadowTarget()

    {

        currentShadowTarget = null;

    }

}